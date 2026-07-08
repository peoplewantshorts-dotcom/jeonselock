// 임차인이 입력·진단한 내용을 '중개사에게 넘어가는 정리된 요청'으로 보여준다.
// 임차인 화면: 내가 보낼 요청 미리보기 / 중개사 화면: 도착한 요청 예시.

export function buildLeadText(lead) {
  return [
    '[월세락] 임차인 요청 정리',
    `📍 매물: ${lead.address}${lead.unit ? ' · ' + lead.unit : ''}`,
    `🏢 건물: ${lead.buildingLine}`,
    `🚦 진단: ${lead.gradeLabel}${lead.warnings.length ? ' — ' + lead.warnings.join(', ') : ''}`,
    `💰 보증금: ${lead.depositText}`,
    `📝 요청 특약: ${lead.clauses.length ? lead.clauses.join(', ') : '없음'}`,
    `🙋 임차인 메모: ${lead.memo || '없음'}`,
    '※ 월세락 무료 진단 기반',
  ].join('\n')
}

export default function LeadCard({ lead }) {
  const rows = [
    { k: '매물', v: `${lead.address}${lead.unit ? ` · ${lead.unit}` : ''}` },
    { k: '건물', v: lead.buildingLine },
    { k: '보증금', v: lead.depositText },
    { k: '요청 특약', v: lead.clauses.length ? lead.clauses.join(', ') : '없음' },
    { k: '임차인 메모', v: lead.memo || '—' },
  ]
  return (
    <div className="lead">
      <div className="lead-row">
        <span className="lead-k">진단</span>
        <span className="lead-v">
          <span className={`lead-grade lg-${lead.gradeLight}`}>{lead.gradeLabel}</span>
          {lead.warnings.length ? <span className="lead-warn"> {lead.warnings.join(' · ')}</span> : null}
        </span>
      </div>
      {rows.map((r) => (
        <div className="lead-row" key={r.k}>
          <span className="lead-k">{r.k}</span>
          <span className="lead-v">{r.v}</span>
        </div>
      ))}
    </div>
  )
}
