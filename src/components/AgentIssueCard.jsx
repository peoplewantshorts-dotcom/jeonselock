// 공인중개사용 — 원하는 서류만 체크해서 한 번에 발급처로 이동.
// 강제로 전부 뽑지 않고 사용자가 고른 것만 연다. 홈(중개사 바로가기)·결과 양쪽에서 공용.
export const AGENT_DOCS = [
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

export default function AgentIssueCard({ addr, docSel, setDocSel }) {
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
        필요한 서류만 <b>체크</b>해서 한 번에 발급처로 이동해요.
        {addr?.road ? (
          <>
            {' '}
            이 주소는 <b>{addr.road}</b>입니다.
          </>
        ) : null}
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
