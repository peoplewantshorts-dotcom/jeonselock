// 공공 API 호출 레이어.
// VITE_API_BASE(Cloudflare Workers 프록시)가 설정되면 실데이터를 쓰고,
// 없거나 실패하면 목업 데이터로 폴백한다. (브라우저 직접 호출은 CORS로 막힘)

import { MOCK_ADDRESSES, MOCK_BUILDINGS, DEFAULT_BUILDING } from './mockData.js'

const BASE = import.meta.env.VITE_API_BASE || ''

// ---------- 주소 자동완성 (도로명주소 API / juso.go.kr) ----------
export async function searchAddress(keyword) {
  const kw = keyword.trim()
  if (kw.length < 2) return []

  if (BASE) {
    try {
      const res = await fetch(`${BASE}/juso?keyword=${encodeURIComponent(kw)}`)
      if (res.ok) {
        const data = await res.json()
        const list = data?.results?.juso
        if (Array.isArray(list)) {
          return list.slice(0, 5).map((j) => ({
            id: j.bdMgtSn, // 건물관리번호 → 건축물대장 조회 키
            road: j.roadAddr,
            detail: j.jibunAddr,
            buildingName: j.bdNm || '',
          }))
        }
      }
    } catch {
      // 프록시 실패 시 목업 폴백
    }
  }

  return MOCK_ADDRESSES.filter(
    (a) => a.road.includes(kw) || a.detail.includes(kw) || a.buildingName.includes(kw),
  ).slice(0, 5)
}

// ---------- 건축물대장 표제부 + 실거래가 ----------
export async function fetchBuilding(addr) {
  if (BASE) {
    try {
      const res = await fetch(`${BASE}/building?bdMgtSn=${encodeURIComponent(addr.id)}`)
      if (res.ok) {
        const data = await res.json()
        if (data && data.mainUse) return data
      }
    } catch {
      // 목업 폴백
    }
  }
  return MOCK_BUILDINGS[addr.id] || DEFAULT_BUILDING
}

// ---------- 위험 진단 (프론트 로컬 계산) ----------
const NON_RESIDENTIAL_KEYWORDS = ['근린생활', '업무시설', '사무소', '숙박']

// 호수 → 층수 추론. "301호" → 3, "1502호" → 15, "지하101" → -1.
// 끝 두 자리를 호(號)로 보고 앞자리를 층으로 해석한다. (예: 301 = 3층 01호)
export function parseUnitFloor(unit) {
  if (!unit) return null
  const u = String(unit).trim()
  if (/지하|지층|반지하|^b/i.test(u)) return -1
  const digits = u.replace(/[^0-9]/g, '')
  if (!digits) return null
  if (digits.length <= 2) return null // "5호"처럼 층을 특정할 수 없는 경우
  return parseInt(digits.slice(0, digits.length - 2), 10)
}

export function diagnose(building, depositMan, unit = '') {
  const flags = []
  let score = 0

  const nonResidential =
    building.isNonResidential ||
    NON_RESIDENTIAL_KEYWORDS.some((k) => (building.mainUse || '').includes(k))

  if (building.violation) {
    score += 40
    flags.push('violation')
  }
  if (nonResidential) {
    score += 30
    flags.push('nonResidential')
  }

  // 층수 vs 호수 불일치 → 서류에 없는 층 = 미신고 불법증축(옥탑) 위반건축물
  const unitFloor = parseUnitFloor(unit)
  let floorMismatch = false
  if (unitFloor != null && unitFloor > 0 && building.groundFloors && unitFloor > building.groundFloors) {
    floorMismatch = true
    score += 45
    flags.push('illegalFloor')
  }

  // 신탁 소유 → 소유권이 신탁사에 있어 임대인과의 계약이 무효가 될 수 있음
  const trust = building.ownerType === '신탁' || /신탁/.test(building.owner || '')
  if (trust) {
    score += 35
    flags.push('trust')
  }

  // 시세 대비 보증금 (깡통 신호)
  const deals = building.recentDeals || []
  const recentPrice = deals.length ? deals[0].priceMan : null
  let depositRatio = null
  if (recentPrice && depositMan > 0) {
    depositRatio = depositMan / recentPrice
    if (depositRatio > 1.0) {
      score += 30
      flags.push('overpriced')
    } else if (depositRatio >= 0.9) {
      score += 15
      flags.push('nearPrice')
    }
  }

  // 노후 건물 (준공 30년 이상)
  const age = new Date().getFullYear() - building.builtYear
  if (age >= 30) {
    score += 10
    flags.push('old')
  }

  score = Math.min(score, 95)

  let grade, gradeLabel, summary
  if (score >= 55) {
    grade = 'danger'
    gradeLabel = '위험'
    summary = '계약 전 반드시 짚어야 할 위험 신호가 있어요. 아래 경고를 꼭 확인하세요.'
  } else if (score >= 25) {
    grade = 'warn'
    gradeLabel = '주의'
    summary = '몇 가지 확인이 필요한 신호가 보여요. 경고 카드를 읽고 계약 조건을 점검하세요.'
  } else {
    grade = 'safe'
    gradeLabel = '안전'
    summary = '공공데이터에서 큰 위험 신호는 발견되지 않았어요. 그래도 체크리스트는 꼭 지켜주세요.'
  }

  return {
    score,
    grade,
    gradeLabel,
    summary,
    flags,
    nonResidential,
    depositRatio,
    recentPrice,
    age,
    unitFloor,
    floorMismatch,
    trust,
  }
}
