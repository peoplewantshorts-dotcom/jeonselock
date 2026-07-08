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

// 항목별 등급만 매기고, "종합 위험도" 판단은 사용자에게 넘긴다(앱이 선고하지 않음).
// S = 안전 / A = 양호 / B = 주의 / C = 위험 신호
export function diagnose(building, depositMan, unit = '') {
  const flags = []

  const nonResidential =
    building.isNonResidential ||
    NON_RESIDENTIAL_KEYWORDS.some((k) => (building.mainUse || '').includes(k))
  if (building.violation) flags.push('violation')
  if (nonResidential) flags.push('nonResidential')

  // 층수 vs 호수 불일치 → 서류에 없는 층 = 미신고 불법증축(옥탑) 위반건축물
  const unitFloor = parseUnitFloor(unit)
  let floorMismatch = false
  if (unitFloor != null && unitFloor > 0 && building.groundFloors && unitFloor > building.groundFloors) {
    floorMismatch = true
    flags.push('illegalFloor')
  }

  // 신탁 소유 → 소유권이 신탁사에 있어 임대인과의 계약이 무효가 될 수 있음
  const trust = building.ownerType === '신탁' || /신탁/.test(building.owner || '')
  if (trust) flags.push('trust')

  // 시세 대비 보증금 (깡통 신호)
  const deals = building.recentDeals || []
  const recentPrice = deals.length ? deals[0].priceMan : null
  let depositRatio = null
  if (recentPrice && depositMan > 0) {
    depositRatio = depositMan / recentPrice
    if (depositRatio > 1.0) flags.push('overpriced')
    else if (depositRatio >= 0.9) flags.push('nearPrice')
  }

  const age = new Date().getFullYear() - building.builtYear
  if (age >= 30) flags.push('old')

  // ---- 항목별 S/A/B/C 등급 ----
  const grades = []

  grades.push({
    key: '위반건축물',
    grade: building.violation || floorMismatch ? 'C' : 'S',
    note: building.violation
      ? '대장에 위반건축물로 등록돼 있어요.'
      : floorMismatch
        ? '서류에 없는 층 — 중개사 확인 필요.'
        : '대장에 위반 표시가 없어요.',
  })

  grades.push({
    key: '건물 용도',
    grade: nonResidential ? 'C' : 'S',
    note: nonResidential
      ? `${building.mainUse} — 주택이 아니라 보증보험이 어려워요.`
      : `${building.mainUse} — 주거용 건물이에요.`,
  })

  grades.push({
    key: '층수·호수',
    grade: floorMismatch ? 'C' : unitFloor != null && unitFloor > 0 ? 'S' : 'A',
    note: floorMismatch
      ? `대장 ${building.floors}인데 ${unitFloor}층 호수 신청.`
      : unitFloor != null && unitFloor > 0
        ? '신청 호수가 대장 층수 안에 있어요.'
        : '호수를 입력하면 불법증축을 대조해드려요.',
  })

  grades.push({
    key: '준공·노후',
    grade: age >= 30 ? 'C' : age >= 20 ? 'B' : age >= 10 ? 'A' : 'S',
    note: `${building.builtYear}년 준공 · ${age}년차.`,
  })

  grades.push({
    key: '소유자',
    grade: trust ? 'C' : 'S',
    note: trust ? `${building.owner} — 신탁 소유예요.` : `${building.owner || '소유자'} 명의예요.`,
  })

  let g6, n6
  if (depositRatio == null) {
    g6 = 'A'
    n6 = '실거래 데이터가 부족해 판단이 어려워요.'
  } else if (depositRatio > 1.0) {
    g6 = 'C'
    n6 = '보증금이 시세보다 높아요. 확인이 필요해요.'
  } else if (depositRatio >= 0.9) {
    g6 = 'B'
    n6 = '보증금이 시세의 90%를 넘어요.'
  } else if (depositRatio >= 0.7) {
    g6 = 'A'
    n6 = '보증금이 시세의 70~90% 수준이에요.'
  } else {
    g6 = 'S'
    n6 = '보증금이 시세보다 넉넉히 낮아요.'
  }
  grades.push({ key: '시세 대비 보증금', grade: g6, note: n6 })

  const counts = grades.reduce(
    (a, g) => {
      a[g.grade] = (a[g.grade] || 0) + 1
      return a
    },
    { S: 0, A: 0, B: 0, C: 0 },
  )

  return {
    grades,
    counts,
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
