import { useEffect, useRef, useState } from 'react'
import { searchAddress } from '../api.js'
import { formatMan } from './widgets.jsx'
import { FEATURES } from '../features.js'

const CHECK_CHIPS = [
  { label: '위반건축물' },
  { label: '근생·업무시설' },
  { label: '불법증축(옥탑)' },
  { label: '신탁 소유' },
  { label: '시세비교' },
  { label: '준공연도' },
  { label: '🔒 근저당 위험도', locked: true },
  { label: '🔒 전세가율', locked: true },
]

const FRAUD_CASES = [
  {
    icon: '🏚️',
    title: '근생빌라 사기',
    desc: '서류상 상가·사무실인 건물을 "주택"이라 속여 전세를 놓아요. 보증보험 가입이 거절돼요.',
  },
  {
    icon: '🫙',
    title: '깡통전세',
    desc: '집값보다 보증금이 비싸요. 집이 경매로 넘어가면 보증금을 다 돌려받지 못해요.',
  },
  {
    icon: '📜',
    title: '신탁사기',
    desc: '집 소유권이 신탁사에 있는데 집주인 행세를 하며 계약해요. 계약 자체가 무효가 될 수 있어요.',
  },
]

export default function HomeScreen({ onDiagnose, onPickFeature }) {
  const [keyword, setKeyword] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [selected, setSelected] = useState(null)
  const [depositRaw, setDepositRaw] = useState('')
  const [unit, setUnit] = useState('')
  const debounceRef = useRef(null)

  // 홈 메뉴 클릭: 중개사는 바로 서류 발급 화면, 소비자·공통은 주소 입력으로 유도
  const pickFeature = (f) => {
    if (f.tag === 'agent') {
      onPickFeature?.('agent')
      return
    }
    const input = document.getElementById('addr-input')
    if (input) {
      input.scrollIntoView({ block: 'center' })
      input.focus()
    }
  }

  // 주소 자동완성 (디바운스 250ms)
  useEffect(() => {
    if (selected && keyword === selected.road) {
      setSuggestions([])
      return
    }
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      const list = await searchAddress(keyword)
      setSuggestions(list)
    }, 250)
    return () => clearTimeout(debounceRef.current)
  }, [keyword, selected])

  const depositMan = parseInt(depositRaw.replace(/[^0-9]/g, ''), 10) || 0

  const handleDepositChange = (e) => {
    const digits = e.target.value.replace(/[^0-9]/g, '')
    setDepositRaw(digits ? Number(digits).toLocaleString() : '')
  }

  const pickAddress = (addr) => {
    setSelected(addr)
    setKeyword(addr.road)
    setSuggestions([])
  }

  const canSubmit = selected && depositMan > 0

  const submit = () => {
    if (canSubmit) onDiagnose(selected, depositMan, unit.trim())
  }

  return (
    <>
      <div className="hero">
        <h1 className="hero-title">
          <span className="gray">월세 계약 전</span>
          미리 확인하세요
        </h1>
        <span className="hero-badge">무료 진단 6가지</span>
      </div>
      <p className="hero-sub">
        주소만 넣으면 공공데이터로 <b>위험 신호</b>를 걸러드려요
      </p>

      {/* 집 정보 입력보다 먼저 — 누구세요? 골라서 바로 들어가기 */}
      <p className="cat-guide">누구세요? 골라서 바로 시작하세요</p>
      <div className="cat-menu">
        {FEATURES.map((f) => (
          <button key={f.n} className="cat-card" onClick={() => pickFeature(f)}>
            <span className="cat-num">{f.n}</span>
            <span className="cat-body">
              <span className="cat-name">{f.short}</span>
              <span className="cat-sub">{f.sub}</span>
            </span>
            <span className="cat-right">
              <span className={`who-tag who-${f.tag}`}>{f.who}</span>
              <span className="cat-arrow" aria-hidden="true">
                ›
              </span>
            </span>
          </button>
        ))}
      </div>

      {/* 주소 + 보증금 입력 */}
      <section className="card">
        <div className="search-wrap">
          <label className="field-label" htmlFor="addr-input">
            집 주소
          </label>
          <input
            id="addr-input"
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
                <button key={s.id} className="autocomplete-item" onClick={() => pickAddress(s)}>
                  <div className="road">{s.road}</div>
                  <div className="detail">{s.detail}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        <label className="field-label" htmlFor="unit-input">
          동/호수 <span style={{ fontWeight: 400 }}>(선택 · 불법증축 판별에 사용)</span>
        </label>
        <input
          id="unit-input"
          className="text-input"
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="예: 301호 (건물 층수보다 높으면 경고)"
          autoComplete="off"
        />

        <label className="field-label" htmlFor="deposit-input" style={{ marginTop: 14 }}>
          보증금 (만원)
        </label>
        <input
          id="deposit-input"
          className="text-input"
          inputMode="numeric"
          value={depositRaw}
          onChange={handleDepositChange}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="보증금 입력 (예: 20,000)"
        />
        {depositMan > 0 && (
          <p className="deposit-preview">
            보증금 <b>{formatMan(depositMan)}</b>
          </p>
        )}

        <button className="primary-btn" disabled={!canSubmit} onClick={submit}>
          진단하기
        </button>
      </section>

      {/* 확인 항목 칩 */}
      <section className="card">
        <h2 className="card-title">이런 걸 확인해드려요</h2>
        <div className="chips">
          {CHECK_CHIPS.map((c) => (
            <span key={c.label} className={`chip ${c.locked ? 'locked' : 'mint'}`}>
              {c.label}
            </span>
          ))}
        </div>
      </section>

      {/* 사기 유형 */}
      <section className="card">
        <h2 className="card-title">전세사기, 이렇게 당해요</h2>
        <div className="fraud-list">
          {FRAUD_CASES.map((f) => (
            <div key={f.title} className="fraud-item">
              <span className="fraud-icon">{f.icon}</span>
              <div>
                <h4>{f.title}</h4>
                <p>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
