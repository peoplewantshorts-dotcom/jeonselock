import { RingGauge, CompareBars, DataTable, formatMan } from './widgets.jsx'

const GRADE_CLASS = { safe: 'grade-safe', warn: 'grade-warn', danger: 'grade-danger' }
const GRADE_DOT = { safe: '🟢', warn: '🟡', danger: '🔴' }

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

export default function ResultScreen({ addr, depositMan, building, result, onBack, onLock }) {
  const { score, grade, gradeLabel, summary, flags, recentPrice } = result

  const baseRows = [
    { label: '주용도', value: building.mainUse, highlight: result.nonResidential },
    {
      label: '준공연도',
      value: `${building.builtYear}년 (${result.age}년차)`,
      highlight: flags.includes('old'),
    },
    { label: '층수', value: building.floors },
    { label: '전용면적', value: `${building.areaM2}㎡` },
    {
      label: '위반건축물',
      value: building.violation ? '등록됨' : '해당 없음',
      highlight: building.violation,
    },
  ]

  const share = async () => {
    const text = `[전세락] ${addr.road} 진단 결과: ${gradeLabel} (위험도 ${score}점)`
    try {
      if (navigator.share) {
        await navigator.share({ title: '전세락 진단 결과', text, url: location.href })
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
              <p>공공데이터 5가지 항목에서 발견된 위험 신호를 점수로 합쳤어요.</p>
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

      {/* 경고 카드 — 조건 충족 시 */}
      {building.violation && (
        <section className="card warn-card">
          <div className="warn-title">⚠️ 위반건축물로 등록된 건물이에요</div>
          <p className="warn-body">
            불법 증축·개조로 적발된 건물이에요. <b>전입신고, 전세대출, 보증보험 가입이 막힐 수
            있고</b>, 시정될 때까지 매년 이행강제금이 부과돼요.
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
