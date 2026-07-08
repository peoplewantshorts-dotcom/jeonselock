// 공시락에서 가져온 공용 위젯: 링 게이지, 비교 막대, 프로그레스 바, 데이터 표
import { useState } from 'react'

const GRADE_COLOR = {
  safe: 'var(--green)',
  warn: 'var(--amber)',
  danger: 'var(--red)',
  mint: 'var(--mint)',
}

// 도넛/링 게이지 — 민트(또는 등급색) arc + 회색 트랙, 가운데 큰 %
export function RingGauge({ value, color = 'mint', size = 116, stroke = 13, centerText }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = Math.min(Math.max(value, 0), 100)
  const arc = (pct / 100) * c
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#e9ebee"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={GRADE_COLOR[color] || color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${arc} ${c - arc}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x="50%"
        y="50%"
        dominantBaseline="central"
        textAnchor="middle"
        fontSize={size * 0.22}
        fontWeight="800"
        fill="var(--text)"
        letterSpacing="-0.5"
      >
        {centerText ?? `${pct}%`}
      </text>
    </svg>
  )
}

// 가로 프로그레스 바 — 회색 트랙 + 민트 채움, 끝 둥글게
export function ProgressBar({ value, color = 'mint' }) {
  const pct = Math.min(Math.max(value, 0), 100)
  return (
    <div className="progress-track">
      <div
        className="progress-fill"
        style={{ width: `${pct}%`, background: GRADE_COLOR[color] || color }}
      />
    </div>
  )
}

// 비교 막대 — 민트 막대 + 회색 막대, 위에 값 라벨 (공시락 '계약 vs 매출' 스타일)
export function CompareBars({ items, maxHeight = 120 }) {
  const max = Math.max(...items.map((i) => i.value), 1)
  return (
    <div className="bars-chart">
      {items.map((item) => (
        <div className="bar-col" key={item.label}>
          <span className={`bar-value ${item.mint ? 'mint' : ''}`}>{item.display}</span>
          <div
            className={`bar-shape ${item.mint ? 'mint' : ''}`}
            style={{ height: Math.max((item.value / max) * maxHeight, 10) }}
          />
          <span className="bar-label">{item.label}</span>
        </div>
      ))}
    </div>
  )
}

// 데이터 표 — 라벨 왼쪽 회색 / 값 오른쪽 굵게, 핵심값 노란 형광.
// hint가 있으면 라벨 옆 '?' 아이콘을 눌러 쉬운 설명을 펼친다.
export function DataTable({ rows }) {
  const [open, setOpen] = useState({})
  return (
    <div className="data-table">
      {rows.map((row, i) => (
        <div className="data-rowwrap" key={row.label}>
          <div className="data-row">
            <span className="data-label">
              {row.label}
              {row.hint && (
                <button
                  className={`data-info ${open[i] ? 'on' : ''}`}
                  onClick={() => setOpen((o) => ({ ...o, [i]: !o[i] }))}
                  aria-label={`${row.label} 쉬운 설명`}
                >
                  ?
                </button>
              )}
            </span>
            <span className="data-value">
              {row.highlight ? <span className="hl">{row.value}</span> : row.value}
            </span>
          </div>
          {row.hint && open[i] && <p className="data-hint">{row.hint}</p>}
        </div>
      ))}
    </div>
  )
}

// 금액(만원) → "1억 5,000만원" 표기
export function formatMan(man) {
  if (man == null || isNaN(man)) return '-'
  const eok = Math.floor(man / 10000)
  const rest = man % 10000
  if (eok > 0 && rest > 0) return `${eok}억 ${rest.toLocaleString()}만원`
  if (eok > 0) return `${eok}억원`
  return `${rest.toLocaleString()}만원`
}
