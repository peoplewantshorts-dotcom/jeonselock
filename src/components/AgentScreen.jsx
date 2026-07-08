import { useEffect, useRef, useState } from 'react'
import { searchAddress } from '../api.js'
import AgentIssueCard from './AgentIssueCard.jsx'

// 공인중개사 전용 화면 — 진단 없이 주소만 넣으면 바로 서류 발급.
export default function AgentScreen({ onBack }) {
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
          진단 없이, <b>주소만 넣으면</b> 확인·설명서 / 등기부 / 건축물대장을 한 번에 발급처로
          이동해요.
        </p>
      </div>

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

      {selected ? (
        <AgentIssueCard addr={selected} docSel={docSel} setDocSel={setDocSel} />
      ) : (
        <section className="card">
          <p className="agent-desc" style={{ margin: 0 }}>
            위에 주소를 먼저 입력하면 발급할 서류를 고를 수 있어요.
          </p>
        </section>
      )}
    </>
  )
}
