import { useEffect, useRef, useState } from 'react'
import { searchAddress } from '../api.js'
import AgentIssueCard from './AgentIssueCard.jsx'
import ClauseList from './ClauseList.jsx'
import { CLAUSES } from '../clauses.js'
import LeadCard from './LeadCard.jsx'
import { RingGauge } from './widgets.jsx'

// 임차인이 앱에서 정리해 보낸 요청이 중개사에게 이렇게 도착한다(데모).
const DEMO_LEAD = {
  address: '서울 관악구 봉천로 100',
  unit: '302호',
  buildingLine: '다세대주택 · 2018년 · 지상 5층',
  gradeLabel: '주의',
  gradeLight: 'yellow',
  warnings: ['보증금 시세 90%↑'],
  depositText: '2억 1,000만원',
  clauses: ['잔금과 동시에 근저당 말소', '선순위 권리 없음 확인'],
  memo: '7월 초 입주 희망, 확정일자 당일 처리 원함',
}

// 공인중개사 전용 화면 — 진단 없이 주소만 넣으면 바로 서류 발급.
export default function AgentScreen({ onBack, onLock }) {
  const [keyword, setKeyword] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [selected, setSelected] = useState(null)
  const [docSel, setDocSel] = useState({ explain: true, registry: true, ledger: true })
  const debounceRef = useRef(null)

  useEffect(() => {
    if (selected && keyword === selected.road) {
      setSuggestions([])
      return
    }
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setSuggestions(await searchAddress(keyword))
    }, 250)
    return () => clearTimeout(debounceRef.current)
  }, [keyword, selected])

  const pick = (addr) => {
    setSelected(addr)
    setKeyword(addr.road)
    setSuggestions([])
  }

  return (
    <>
      <button className="back-btn" onClick={onBack}>
        <span className="arrow">&lt;</span> 처음으로
      </button>

      <div className="result-head">
        <span className="who-tag who-agent" style={{ display: 'inline-block', marginBottom: 8 }}>
          중개사 전용
        </span>
        <h1 className="result-addr">서류 원클릭 발급</h1>
        <p className="result-note">
          임차인이 앱에서 <b>정리해 보낸 요청</b>을 받아, 서류·특약까지 한 화면에서 처리해요.
        </p>
      </div>

      {/* 임차인에게서 온 정리된 요청 (데모) — 중개사가 받는 데이터 */}
      <section className="card">
        <span className="cat-pill cat-mint">도착한 요청</span>
        <h2 className="card-title">임차인이 정리해 보낸 요청</h2>
        <p className="agent-desc">
          임차인이 매물·진단·조건·요청 특약을 <b>정리해서 보내요.</b> 반복 질문·간보기 없이 바로
          상담·계약으로 넘어갈 수 있어요.
        </p>
        <LeadCard lead={DEMO_LEAD} />
      </section>

      <section className="card">
        <div className="search-wrap">
          <label className="field-label" htmlFor="agent-addr">
            발급할 집 주소
          </label>
          <input
            id="agent-addr"
            className="text-input"
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value)
              setSelected(null)
            }}
            placeholder="도로명주소 입력 (예: 서울 관악구 봉천로 100)"
            autoComplete="off"
          />
          {suggestions.length > 0 && (
            <div className="autocomplete">
              {suggestions.map((s) => (
                <button key={s.id} className="autocomplete-item" onClick={() => pick(s)}>
                  <div className="road">{s.road}</div>
                  <div className="detail">{s.detail}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 1) 표준 특약 자동 작성 — 중개사 핵심 도구 (주소 없어도 사용 가능) */}
      <section className="card">
        <span className="cat-pill cat-purple">중개사 핵심</span>
        <h2 className="card-title">표준 특약 자동 작성</h2>
        <p className="agent-desc">
          법적 효력 있는 <b>표준 특약</b>을 골라 <b>한 번에 복사</b>해 계약서에 붙여넣으세요. 특약이
          탄탄할수록 계약 성사·신뢰가 올라가요.
        </p>
        <ClauseList clauses={CLAUSES} mode="agent" />
        <p className="agent-caveat">
          표준 문구 예시예요. 실제 계약은 물건별 사정에 맞게 조정하고, 필요 시 법률 검토를 받으세요.
        </p>
      </section>

      {/* 2) 서류 발급 (체크리스트) */}
      {selected ? (
        <AgentIssueCard addr={selected} docSel={docSel} setDocSel={setDocSel} />
      ) : (
        <section className="card">
          <p className="agent-desc" style={{ margin: 0 }}>
            위에 주소를 먼저 입력하면 발급할 서류를 고를 수 있어요.
          </p>
        </section>
      )}

      {/* 3) 🔒 정밀진단 — 등기부 자동 분석 (업셀) */}
      <section className="card locked-card">
        <div className="locked-content">
          <span className="cat-pill cat-purple">정밀진단</span>
          <h2 className="card-title">등기부 정밀 분석</h2>
          <div className="innerbox">
            <div className="gauge-row">
              <RingGauge value={72} color="danger" centerText="72%" />
              <div className="gauge-desc">
                <h3>근저당·신탁·압류 자동 분석</h3>
                <p>등기부를 읽어 권리관계를 한 번에 정리해드려요.</p>
              </div>
            </div>
          </div>
        </div>
        <div className="lock-overlay">
          <span className="lock-icon">🔒</span>
          <span className="lock-title">등기부 정밀 분석</span>
          <span className="lock-desc">
            근저당·신탁·압류까지 등기부를 자동 분석해 계약 리스크를 줄여줘요.
          </span>
          <button className="lock-btn" onClick={onLock}>
            정밀 진단으로 확인하기
          </button>
        </div>
      </section>
    </>
  )
}
