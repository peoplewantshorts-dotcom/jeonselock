import { useState } from 'react'
import { RingGauge, CompareBars, DataTable, formatMan } from './widgets.jsx'

// 공인중개사용 — 원하는 서류만 체크해서 한 번에 발급처로 이동.
// 강제로 전부 뽑지 않고 사용자가 고른 것만 연다.
const AGENT_DOCS = [
  {
    id: 'explain',
    name: '중개대상물 확인·설명서',
    note: '중개사가 작성·교부하는 서식 (무료)',
    url: 'https://www.gov.kr/search?srhQuery=%EC%A4%91%EA%B0%9C%EB%8C%80%EC%83%81%EB%AC%BC+%ED%99%95%EC%9D%B8%EC%84%A4%EB%AA%85%EC%84%9C',
  },
  {
    id: 'registry',
    name: '등기부등본 (등기사항전부증명서)',
    note: '대법원 인터넷등기소 · 열람 700원/발급 1,000원',
    url: 'https://www.iros.go.kr',
  },
  {
    id: 'ledger',
    name: '건축물대장',
    note: '정부24 · 무료',
    url: 'https://www.gov.kr/mw/AA020InfoCappView.do?CappBizCD=15000000098',
  },
]

function AgentIssueCard({ addr, docSel, setDocSel }) {
  const selected = AGENT_DOCS.filter((d) => docSel[d.id])

  const openSelected = () => {
    // 체크한 서류만 순서대로 발급처 새 탭으로 연다.
    selected.forEach((d, i) => setTimeout(() => window.open(d.url, '_blank', 'noopener'), i * 400))
  }

  return (
    <section className="card">
      <span className="cat-pill cat-purple">공인중개사용</span>
      <h2 className="card-title">서류 원스톱 발급</h2>
      <p className="agent-desc">
        필요한 서류만 <b>체크</b>해서 한 번에 발급처로 이동해요. 이 주소는{' '}
        <b>{addr.road}</b>입니다.
      </p>
      <div className="agent-list">
        {AGENT_DOCS.map((d) => (
          <label key={d.id} className={`agent-item ${docSel[d.id] ? 'on' : ''}`}>
            <input
              type="checkbox"
              checked={!!docSel[d.id]}
              onChange={(e) => setDocSel((s) => ({ ...s, [d.id]: e.target.checked }))}
            />
            <span className="agent-check" aria-hidden="true" />
            <span className="agent-text">
              <span className="agent-name">{d.name}</span>
              <span className="agent-note">{d.note}</span>
            </span>
          </label>
        ))}
      </div>
      <button className="agent-btn" disabled={selected.length === 0} onClick={openSelected}>
        {selected.length > 0 ? `선택한 ${selected.length}개 서류 발급하기` : '발급할 서류를 선택하세요'}
      </button>
      <p className="agent-caveat">
        등기부는 대법원, 확인·설명서는 서식 작성용이라 각 발급처로 연결돼요. 건축물대장만 무료 즉시
        열람이에요.
      </p>
    </section>
  )
}

// 건축물대장 각 항목이 뭘 뜻하는지 대학생 눈높이로 풀어주는 코너.
// 대장에서 따온 실제 값(building) 옆에 한 줄 해설을 붙이고,
// 마지막에 '지금 이 집' 판정(층수-호수 대조)을 콕 집어준다.
function RegisterGuide({ building, result, unit }) {
  const [open, setOpen] = useState(false)

  const fields = [
    {
      key: '주용도',
      value: building.mainUse,
      danger: result.nonResidential,
      desc: result.nonResidential
        ? "이 건물은 서류상 '주택'이 아니라 상가·사무실이에요. 전세보증보험 가입이 거절될 수 있어요."
        : '이 건물이 법적으로 어떤 용도로 등록됐는지예요. 근린생활시설·업무시설이면 주거용이 아니라 위험해요.',
    },
    {
      key: '층수',
      value: building.floors,
      danger: result.floorMismatch,
      desc: '건물이 지상 몇 층까지 있는지예요. 내 호수의 층이 이 숫자보다 높으면 서류에 없는 층 = 불법증축이에요.',
    },
    {
      key: '준공연도',
      value: `${building.builtYear}년`,
      danger: result.flags.includes('old'),
      desc: '건물을 다 지은 해예요. 오래될수록 하자·노후 위험이 커지고, 전세대출 한도가 줄기도 해요.',
    },
    {
      key: '위반건축물',
      value: building.violation ? '등록됨' : result.floorMismatch ? '미신고 의심' : '해당 없음',
      danger: building.violation || result.floorMismatch,
      desc: "대장 맨 위에 노란 글씨로 '위반건축물' 도장이 있으면, 벌금은 집주인이 내지만 세입자는 전세대출·보증보험이 막혀요.",
    },
    {
      key: '소유자',
      value: building.owner || '확인 불가',
      danger: result.trust,
      desc: result.trust
        ? '소유자가 신탁회사예요. 집주인이 마음대로 전세를 놓을 수 없어서, 신탁사 동의 없이 계약하면 무효가 될 수 있어요.'
        : '진짜 집주인이 누구인지예요. 계약 상대가 대장·등기부의 소유자와 같은 사람인지 꼭 확인하세요.',
    },
  ]

  // '지금 이 집' 판정 (층수 vs 호수)
  let verdict
  if (unit && result.floorMismatch) {
    verdict = {
      tone: 'danger',
      icon: '🚨',
      text: (
        <>
          지금 이 집은 대장상 <b>{building.floors}</b>인데, 신청하신 호수는{' '}
          <b>
            {result.unitFloor}층({unit})
          </b>
          이에요. <b>{result.unitFloor}층은 건축물대장에 없는 층</b>이라, 아직 신고만 안 됐을 뿐{' '}
          <b>사실상 위반건축물</b>이에요.
        </>
      ),
    }
  } else if (unit && result.unitFloor > 0) {
    verdict = {
      tone: 'ok',
      icon: '✅',
      text: (
        <>
          신청하신 호수 <b>{unit}</b> — 대장상 층수(<b>{building.floors}</b>) 안에 있어요. 층수
          기준으로는 불법증축 신호가 없어요.
        </>
      ),
    }
  } else {
    verdict = {
      tone: 'info',
      icon: '💡',
      text: (
        <>
          <b>동/호수</b>를 함께 입력하면, 그 호수가 대장에 실제로 있는 층인지 바로 대조해드려요. (예:
          대장이 2층인데 301호면 서류에 없는 층)
        </>
      ),
    }
  }

  return (
    <section className="card">
      <span className="cat-pill cat-mint">건축물대장</span>
      <h2 className="card-title">건축물대장, 이렇게 읽어요</h2>
      <p className="guide-intro">
        건축물대장은 이 건물의 <b>주민등록등본</b> 같은 서류예요. 정부24에서 누구나 뗄 수 있고, 여기서
        아래 <b>5가지</b>만 봐도 위험한 집을 거를 수 있어요.
      </p>

      <button className="guide-toggle" onClick={() => setOpen((v) => !v)}>
        {open ? '접기 ▲' : '📄 대장 미리보기 · 쉽게 풀어보기 ▼'}
      </button>

      {open && (
        <div className="guide-preview">
          {fields.map((f) => (
            <div className="guide-field" key={f.key}>
              <div className="guide-field-head">
                <span className="g-label">{f.key}</span>
                <span className={`g-value ${f.danger ? 'danger' : ''}`}>{f.value}</span>
              </div>
              <p className="g-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      )}

      <div className={`guide-callout ${verdict.tone}`}>
        <span className="gc-icon">{verdict.icon}</span>
        <p>{verdict.text}</p>
      </div>
    </section>
  )
}

// 손님이 스스로 판단하도록 맡기는 노트형 체크리스트.
// 어려운 용어(근저당·확정일자·시세)는 몰라도 되게, 초보자가 '물어보고 확인'할 수 있는 말로.
const SELF_CHECK = [
  {
    id: 'c1',
    text: '계약하는 사람이 진짜 집주인이 맞는지 확인했어요',
    hint: '신분증 이름과 등기부(집 주인이 적힌 서류)의 주인 이름이 같은지 부동산에 확인해 달라고 하세요.',
  },
  {
    id: 'c2',
    text: '이 집에 잡혀 있는 빚(대출)이 얼마인지 물어봤어요',
    hint: '집을 담보로 받은 대출이 많으면, 잘못될 때 내 보증금이 위험해요. 부동산에 “빚이 얼마 있어요?”라고 물어보세요.',
  },
  {
    id: 'c3',
    text: '이사 첫날 전입신고 + 확정일자를 하기로 했어요',
    hint: '동사무소에서 3분이면 끝나요. 내 보증금을 지키는 가장 중요한 안전장치라, 이거 하나만 해도 크게 안심돼요.',
  },
  {
    id: 'c5',
    text: '이해 안 되는 건 부동산에 전부 다시 물어봤어요',
    hint: '어려운 말로 대충 넘어가려 하면, 쉽게 설명해 달라고 하세요. 자세히 설명해 주는 게 좋은 부동산이에요.',
  },
]

// 결과 리포트의 3가지 메인 기능 (맨 위 코너 + 섹션 헤더)
const FEATURES = [
  {
    n: 1,
    id: 'feat-1',
    name: '건축물대장 쉽게 읽기',
    desc: '건축물대장 = 건물의 신분증. 어려운 말을 한 줄로',
    short: '건물의 신분증 읽기',
  },
  {
    n: 2,
    id: 'feat-2',
    name: '등급 확인 & 직접 판단',
    desc: 'S·A·B·C 보고 스스로',
    short: '등급 보고 직접 판단',
  },
  {
    n: 3,
    id: 'feat-3',
    name: '중개사 원클릭 발급',
    desc: '원하는 서류만 골라',
    short: '서류 원클릭 발급',
  },
]

function FeatureHead({ n, id, name, desc }) {
  return (
    <div className="feature-head" id={id}>
      <span className="feature-num">{n}</span>
      <div className="feature-htext">
        <h2>{name}</h2>
        <p>{desc}</p>
      </div>
    </div>
  )
}

export default function ResultScreen({ addr, depositMan, unit, building, result, onBack, onLock }) {
  const { grades, counts, flags, recentPrice } = result
  const [checked, setChecked] = useState({}) // 손님이 직접 체크하는 판단 체크리스트
  const [docSel, setDocSel] = useState({ explain: true, registry: true, ledger: true })
  const checkedCount = SELF_CHECK.filter((i) => checked[i.id]).length

  const scrollToId = (id) => {
    const el = document.getElementById(id)
    if (!el) return
    // 부드러운 스크롤은 reduced-motion 환경에서 무시되므로, 확실히 이동하도록 위치를 직접 계산.
    const y = el.getBoundingClientRect().top + window.scrollY - 66 // sticky 헤더 높이 보정
    window.scrollTo({ top: y, behavior: 'smooth' })
    window.scrollTo(0, y) // smooth이 막힌 환경 대비 즉시 이동 보장
  }

  // 종합 신호등 — 항목 등급을 한눈에(참고용). 최악 등급이 신호를 결정.
  const overall =
    counts.C > 0
      ? { key: '위험', light: 'red', desc: '위험 신호(C 등급)가 있어요. 아래 경고를 꼭 확인하세요.' }
      : counts.B > 0
        ? { key: '주의', light: 'yellow', desc: '주의가 필요한 항목(B 등급)이 있어요. 조건을 점검하세요.' }
        : { key: '안전', light: 'green', desc: '큰 위험 신호는 보이지 않아요. 그래도 체크리스트는 지키세요.' }

  const baseRows = [
    { label: '주용도', value: building.mainUse, highlight: result.nonResidential },
    { label: '소유자', value: building.owner || '확인 불가', highlight: result.trust },
    {
      label: '준공연도',
      value: `${building.builtYear}년 (${result.age}년차)`,
      highlight: flags.includes('old'),
    },
    {
      label: '층수',
      value: unit ? `${building.floors} · 신청 ${unit}` : building.floors,
      highlight: result.floorMismatch,
    },
    { label: '전용면적', value: `${building.areaM2}㎡` },
    {
      label: '위반건축물',
      value: building.violation ? '등록됨' : result.floorMismatch ? '미신고 의심' : '해당 없음',
      highlight: building.violation || result.floorMismatch,
    },
  ]

  const share = async () => {
    const text = `[월세락] ${addr.road} 진단 리포트 — 위험신호(C) ${counts.C}개 · 주의(B) ${counts.B}개`
    try {
      if (navigator.share) {
        await navigator.share({ title: '월세락 진단 결과', text, url: location.href })
      } else {
        await navigator.clipboard.writeText(`${text}\n${location.href}`)
        alert('진단 결과 링크를 복사했어요.')
      }
    } catch {
      /* 사용자가 공유를 취소한 경우 */
    }
  }

  // 잠금 카드용 목업 수치 (블러 아래 구조만 보여줌)
  const mortgageRatio = 72
  const jeonseRatio = recentPrice ? Math.min(Math.round((depositMan / recentPrice) * 100), 130) : 85

  return (
    <>
      <button className="back-btn" onClick={onBack}>
        <span className="arrow">&lt;</span> 목록
      </button>

      {/* 최상단 — 먼저 고르는 3가지 기능 메뉴 (주소보다 위, 눌러서 해당 코너로 이동) */}
      <p className="menu-guide">먼저 볼 기능을 골라보세요</p>
      <div className="menu-bar">
        {FEATURES.map((f) => (
          <button key={f.n} className="menu-item" onClick={() => scrollToId(f.id)}>
            <span className="menu-num">{f.n}</span>
            <span className="menu-name">{f.short}</span>
          </button>
        ))}
      </div>

      {/* 주소 */}
      <div className="result-head">
        <h1 className="result-addr">{addr.road}</h1>
        {addr.buildingName && <p className="result-bname">{addr.detail}</p>}
        <p className="result-note">
          항목별 등급을 확인하고, <b>종합 판단은 맨 아래에서 직접</b> 내려보세요.
        </p>
      </div>

      {/* 종합 신호등 (참고용 한눈에 보기) */}
      <section className="card">
        <span className="cat-pill cat-mint">종합 신호</span>
        <div className="signal-main">
          <div className="traffic" role="img" aria-label={`종합 신호 ${overall.key}`}>
            <div className="tl-housing">
              <span className={`tl-lamp red ${overall.light === 'red' ? 'on' : ''}`} />
              <span className={`tl-lamp yellow ${overall.light === 'yellow' ? 'on' : ''}`} />
              <span className={`tl-lamp green ${overall.light === 'green' ? 'on' : ''}`} />
            </div>
            <div className="tl-labels">
              <span className={`tl-lbl red ${overall.light === 'red' ? 'on' : ''}`}>위험</span>
              <span className={`tl-lbl yellow ${overall.light === 'yellow' ? 'on' : ''}`}>주의</span>
              <span className={`tl-lbl green ${overall.light === 'green' ? 'on' : ''}`}>안전</span>
            </div>
          </div>
          <div className="signal-verdict">
            <p className="sv-desc">{overall.desc}</p>
            <p className="sv-counts">
              위험 {counts.C} · 주의 {counts.B} · 양호 {counts.A} · 안전 {counts.S}
            </p>
          </div>
        </div>
        <p className="signal-note">
          앱이 매긴 <b>참고 신호</b>예요.
          <br />
          최종 판단은 <b>맨 아래에서 직접</b> 내려주세요.
        </p>
      </section>

      {/* ① 건축물대장 쉽게 읽기 */}
      <FeatureHead {...FEATURES[0]} />

      <section className="card">
        <h2 className="card-title">건축물대장 기본정보</h2>
        <DataTable rows={baseRows} />
      </section>

      <RegisterGuide building={building} result={result} unit={unit} />

      {/* ② 등급 확인 & 직접 판단 */}
      <FeatureHead {...FEATURES[1]} />

      <section className="card">
        <span className="cat-pill cat-mint">항목별 등급</span>
        <h2 className="card-title">항목별로 확인하세요</h2>
        <div className="grade-legend">
          <span>
            <b className="lg lg-S">S</b> 안전
          </span>
          <span>
            <b className="lg lg-A">A</b> 양호
          </span>
          <span>
            <b className="lg lg-B">B</b> 주의
          </span>
          <span>
            <b className="lg lg-C">C</b> 위험 신호
          </span>
        </div>
        <div className="grade-list">
          {grades.map((g) => (
            <div className="grade-row" key={g.key}>
              <span className={`grade-chip g-${g.grade}`}>{g.grade}</span>
              <div className="grade-text">
                <h4>{g.key}</h4>
                <p>{g.note}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="grade-tip">
          <b>종합 위험도는 앱이 정하지 않아요.</b> 각 등급과 아래 상세를 보고, 이 섹션 끝의
          체크리스트로 직접 판단해보세요.
        </p>
      </section>

      {/* 경고 카드 — 조건 충족 시 */}
      {result.floorMismatch && (
        <section className="card warn-card">
          <div className="warn-title">⚠️ 서류에 없는 층이에요 (불법증축 의심)</div>
          <p className="warn-body">
            건축물대장상 이 건물은 <b>{building.floors}</b>인데, 신청하신 호수는{' '}
            <b>{result.unitFloor}층({unit})</b>이에요. 서류에 없는 층은 옥탑방 등을{' '}
            <b>신고 없이 불법증축</b>한 경우가 많아요. 벌금(이행강제금)은 집주인이 무는 거라
            세입자가 낼 돈은 없지만, 세입자에겐 <b>전입신고·확정일자·전세대출·전세보증보험이 모두
            막히는</b> 게 진짜 문제예요.
          </p>
        </section>
      )}
      {building.violation && (
        <section className="card warn-card">
          <div className="warn-title">⚠️ 위반건축물로 등록된 건물이에요</div>
          <p className="warn-body">
            불법 증축·개조로 적발된 건물이에요. <b>이행강제금(벌금)은 집주인이 무는 거라 세입자가
            낼 돈은 없어요.</b> 하지만 세입자에겐 더 큰 문제가 있어요 — <b>전세대출·전세보증보험
            가입이 막히고, 전입신고에도 불이익</b>이 생길 수 있어요.
          </p>
        </section>
      )}
      {result.trust && (
        <section className="card warn-card">
          <div className="warn-title">⚠️ 소유자가 신탁회사예요</div>
          <p className="warn-body">
            이 집의 소유권은 <b>{building.owner}</b>에 있어요. 집주인(위탁자)이 마음대로 전세를
            놓을 권한이 없어서, <b>신탁사 동의 없이 계약하면 보증금을 날리고 계약이 무효가 될 수
            있어요.</b> 반드시 <b>신탁원부</b>를 확인하고 신탁사의 임대 동의를 받으세요.
          </p>
        </section>
      )}
      {result.nonResidential && (
        <section className="card warn-card">
          <div className="warn-title">⚠️ 이 건물은 &lsquo;주택&rsquo;이 아니에요</div>
          <p className="warn-body">
            서류상 용도가 <b>{building.mainUse}</b>이에요. 사무실·상가로 등록된 집은{' '}
            <b>전세보증보험 가입이 거절될 수 있고</b>, 문제가 생겨도 주택 세입자 보호를 온전히
            받기 어려워요.
          </p>
        </section>
      )}
      {flags.includes('overpriced') && (
        <section className="card warn-card">
          <div className="warn-title">⚠️ 보증금이 최근 시세보다 높아요</div>
          <p className="warn-body">
            집이 경매로 넘어가면 <b>보증금을 전부 돌려받지 못할 수 있는</b> 전형적인 깡통전세
            신호예요. 보증금 조정이나 월세 전환을 고민해보세요.
          </p>
        </section>
      )}

      {/* 시세 비교 */}
      <section className="card">
        <span className="cat-pill cat-orange">시세비교</span>
        <h2 className="card-title">내 보증금 vs 최근 시세</h2>
        <div className="innerbox">
          <div className="bars-box">
            <CompareBars
              items={[
                { label: '내 보증금', value: depositMan, display: formatMan(depositMan), mint: true },
                {
                  label: '최근 시세',
                  value: recentPrice || 0,
                  display: recentPrice ? formatMan(recentPrice) : '데이터 없음',
                },
              ]}
            />
            <div className="bars-side">
              <div>
                <div className="metric-label">시세 대비 보증금</div>
                <div className="metric-value">
                  {recentPrice ? (
                    <span className="hl">{Math.round((depositMan / recentPrice) * 100)}%</span>
                  ) : (
                    '-'
                  )}
                </div>
              </div>
              <div>
                <div className="metric-label">최근 거래</div>
                <div className="metric-value" style={{ fontSize: 16 }}>
                  {building.recentDeals[0]
                    ? `${building.recentDeals[0].date} · ${building.recentDeals[0].type}`
                    : '-'}
                </div>
              </div>
            </div>
          </div>
        </div>
        <p className="bars-note">
          국토교통부 실거래가 공개시스템의 같은 건물·비슷한 면적 최근 거래 기준이에요.
        </p>
      </section>

      {/* 🔒 근저당 위험도 */}
      <section className="card locked-card">
        <div className="locked-content">
          <span className="cat-pill cat-purple">근저당 위험도</span>
          <h2 className="card-title">빚 + 내 보증금, 집값을 넘나요?</h2>
          <div className="innerbox">
            <div className="gauge-row">
              <RingGauge value={mortgageRatio} color="danger" centerText={`${mortgageRatio}%`} />
              <div className="gauge-desc">
                <h3>(근저당 + 보증금) ÷ 시세</h3>
                <p>80%를 넘으면 경매 시 보증금 일부를 못 받을 수 있어요.</p>
              </div>
            </div>
          </div>
        </div>
        <div className="lock-overlay">
          <span className="lock-icon">🔒</span>
          <span className="lock-title">근저당 위험도</span>
          <span className="lock-desc">
            등기부등본의 근저당(집주인 빚)까지 합쳐 경매 시 내 보증금이 안전한지 계산해드려요.
          </span>
          <button className="lock-btn" onClick={onLock}>
            정밀 진단으로 확인하기
          </button>
        </div>
      </section>

      {/* 🔒 전세가율 */}
      <section className="card locked-card">
        <div className="locked-content">
          <span className="cat-pill cat-purple">전세가율</span>
          <h2 className="card-title">이 동네에서 안전한 보증금일까요?</h2>
          <div className="innerbox">
            <div className="bars-box">
              <CompareBars
                items={[
                  { label: '내 전세가율', value: jeonseRatio, display: `${jeonseRatio}%`, mint: true },
                  { label: '지역 평균', value: 68, display: '68%' },
                ]}
              />
              <div className="bars-side">
                <div>
                  <div className="metric-label">깡통전세 경고선</div>
                  <div className="metric-value">80%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="lock-overlay">
          <span className="lock-icon">🔒</span>
          <span className="lock-title">전세가율 분석</span>
          <span className="lock-desc">
            매매가 대비 전세금 비율을 동네 평균과 비교해 깡통전세 위험을 알려드려요.
          </span>
          <button className="lock-btn" onClick={onLock}>
            정밀 진단으로 확인하기
          </button>
        </div>
      </section>

      {/* 직접 판단 체크리스트 — 초보자도 물어보고 확인할 수 있는 쉬운 말 */}
      <section className="card">
        <h2 className="card-title">부동산에 이것만 물어보세요</h2>
        <p className="self-desc">
          어려운 건 몰라도 괜찮아요. <b>아래 {SELF_CHECK.length}가지만 부동산에 확인</b>하면 큰 위험은
          걸러져요. 하나씩 체크하면서 스스로 판단해보세요.
        </p>
        <div className="note-check">
          {SELF_CHECK.map((it) => (
            <label key={it.id} className={`note-item ${checked[it.id] ? 'on' : ''}`}>
              <input
                type="checkbox"
                checked={!!checked[it.id]}
                onChange={(e) => setChecked((s) => ({ ...s, [it.id]: e.target.checked }))}
              />
              <span className="note-box" aria-hidden="true" />
              <span className="note-text">
                <b>{it.text}</b>
                <span className="note-hint">{it.hint}</span>
              </span>
            </label>
          ))}
        </div>
        <div className="note-foot">
          <span className="note-count">
            {checkedCount} / {SELF_CHECK.length} 확인
          </span>
          <p>
            {checkedCount === SELF_CHECK.length
              ? '다 확인했어요. 최종 결정과 책임은 본인에게 있어요.'
              : '체크가 많을수록 안심할 수 있어요. 최종 결정은 본인 몫이에요.'}
          </p>
        </div>
      </section>

      {/* ③ 공인중개사 원클릭 발급 */}
      <FeatureHead {...FEATURES[2]} />

      <AgentIssueCard addr={addr} docSel={docSel} setDocSel={setDocSel} />

      {/* 하단 버튼 */}
      <div className="action-row">
        <button className="action-btn" onClick={share}>
          공유하기
        </button>
        <button
          className="action-btn"
          onClick={() =>
            window.open(
              'https://www.gov.kr/mw/AA020InfoCappView.do?CappBizCD=15000000098',
              '_blank',
              'noopener',
            )
          }
        >
          건축물대장 원문 (정부24)
        </button>
      </div>
    </>
  )
}
