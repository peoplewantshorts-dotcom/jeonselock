import { useState } from 'react'

// 특약 목록.
// mode 'tenant': 상황별 추천 + 문구 복사 (임차인)
// mode 'agent' : 선택 + 전체 복사 (중개인 자동 작성 도구)
export default function ClauseList({ clauses, mode = 'tenant' }) {
  const [copiedId, setCopiedId] = useState(null)
  const [sel, setSel] = useState(() => Object.fromEntries(clauses.map((c) => [c.id, true])))

  const copy = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      setTimeout(() => setCopiedId((v) => (v === id ? null : v)), 1500)
    } catch {
      /* 클립보드 미지원 환경 무시 */
    }
  }

  const selected = clauses.filter((c) => sel[c.id])

  const copyAll = () => {
    const body = selected.map((c, i) => `${i + 1}. ${c.text}`).join('\n')
    copy(body, '__all__')
  }

  return (
    <div className="clause-list">
      {clauses.map((c) => (
        <div key={c.id} className={`clause-item ${mode === 'agent' && sel[c.id] ? 'on' : ''}`}>
          <div className="clause-head">
            {mode === 'agent' && (
              <input
                type="checkbox"
                className="clause-check"
                checked={!!sel[c.id]}
                onChange={(e) => setSel((s) => ({ ...s, [c.id]: e.target.checked }))}
                aria-label={c.title}
              />
            )}
            <span className="clause-title">{c.title}</span>
            {mode === 'tenant' && (
              <button className="clause-copy" onClick={() => copy(c.text, c.id)}>
                {copiedId === c.id ? '복사됨' : '복사'}
              </button>
            )}
          </div>
          <p className="clause-why">{c.why}</p>
          <p className="clause-text">“{c.text}”</p>
        </div>
      ))}

      {mode === 'agent' && (
        <button className="clause-copyall" disabled={selected.length === 0} onClick={copyAll}>
          {copiedId === '__all__'
            ? '계약서용으로 복사됐어요'
            : selected.length > 0
              ? `선택한 ${selected.length}개 특약 전체 복사`
              : '복사할 특약을 선택하세요'}
        </button>
      )}
    </div>
  )
}
