import { useState } from 'react'
import { RingGauge, CompareBars, DataTable, formatMan } from './widgets.jsx'

const GRADE_CLASS = { safe: 'grade-safe', warn: 'grade-warn', danger: 'grade-danger' }
const GRADE_DOT = { safe: '🟢', warn: '🟡', danger: '🔴' }

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

const CHECKLIST = [
  {
    title: '잔금일에 전입신고 + 확정일자',
    desc: '이사 당일 주민센터(또는 정부24)에서 바로 처리하세요. 하루만 늦어도 순위가 밀릴 수 있어요.',
  },
  {
    title: '잔금 직전 등기부등본 다시 떼기',
    desc: '계약일과 잔금일 사이에 근저당이 새로 잡히는 사기가 있어요. 잔금 치르기 직전에 한 번 더 확인하세요.',
  },
  {
    title: '"잔금과 동시에 근저당 말소" 특약 넣기',
    desc: '집주인이 이 특약을 거부하면 그 자체가 위험 신호예요. 계약을 다시 생각해보세요.',
  },
]

export default function ResultScreen({ addr, depositMan, unit, building, result, onBack, onLock }) {
  const { score, grade, gradeLabel, summary, flags, recentPrice } = result

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
    const text = `[월세락] ${addr.road} 진단 결과: ${gradeLabel} (위험도 ${score}점)`
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

      {/* 주소 + 등급 */}
      <div className="result-head">
        <h1 className="result-addr">{addr.road}</h1>
        {addr.buildingName && <p className="result-bname">{addr.detail}</p>}
        <span className={`grade-badge ${GRADE_CLASS[grade]}`}>
          {GRADE_DOT[grade]} {gradeLabel}
        </span>
      </div>

      {/* 종합 위험 요약 */}
      <section className="card">
        <span className="cat-pill cat-mint">종합 진단</span>
        <div className="innerbox">
          <div className="gauge-row">
            <RingGauge value={score} color={grade} centerText={`${score}점`} />
            <div className="gauge-desc">
              <h3>계약 전 위험도</h3>
              <p>공공데이터 여러 항목에서 발견된 위험 신호를 점수로 합쳤어요.</p>
            </div>
          </div>
        </div>
        <p className="summary-quote">{summary}</p>
      </section>

      {/* 기본정보 표 */}
      <section className="card">
        <h2 className="card-title">건축물대장 기본정보</h2>
        <DataTable rows={baseRows} />
      </section>

      {/* 건축물대장 쉬운 해설 + 이 집 판정 */}
      <RegisterGuide building={building} result={result} unit={unit} />

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
                <div className="metric-value" style={{ fontSize: 16, whiteSpace: 'nowrap' }}>
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

      {/* 체크리스트 */}
      <section className="card">
        <h2 className="card-title">계약 전 이것만은 꼭</h2>
        <div className="check-list">
          {CHECKLIST.map((c, i) => (
            <div key={c.title} className="check-item">
              <span className="check-num">{i + 1}</span>
              <div>
                <h4>{c.title}</h4>
                <p>{c.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

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
