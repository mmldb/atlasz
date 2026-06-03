function formatValue(value) {
  if (Array.isArray(value)) return value.join(' / ')
  if (value === null || value === undefined || value === '') return 'nincs adat'
  return String(value)
}

function FieldRow({ label, field, extractionsById, sourcesById }) {
  const extractionIds = field?.source_extraction_ids ?? []
  const extraction = extractionIds.length ? extractionsById[extractionIds[0]] : null
  const source = extraction ? sourcesById[extraction.source_id] : null

  return (
    <div className="field-row">
      <div className="field-header">
        <span>{label}</span>
        <span className={`status-pill status-${field?.verification_status ?? 'empty'}`}>
          {field?.verification_status ?? 'empty'}
        </span>
      </div>
      <p className="field-value">{formatValue(field?.value)}</p>
      {extraction && (
        <details className="source-details">
          <summary>Forrás / bizonyíték</summary>
          <blockquote>{extraction.quote}</blockquote>
          <p><strong>Értelmezés:</strong> {extraction.paraphrase}</p>
          <p><strong>Forrás:</strong> {source?.author}: <em>{source?.title}</em></p>
          <p><strong>Lokátor:</strong> PDF oldal {extraction.source_locator?.pdf_page_label}, szövegsorok {extraction.source_locator?.text_lines?.join('–')}</p>
        </details>
      )}
    </div>
  )
}

export default function ReviewPanel({ region, activeLayer, extractionsById, sourcesById, reviewItems }) {
  const layer = region?.layers?.[activeLayer] ?? {}

  return (
    <div className="card review-panel">
      <p className="eyebrow">Kiválasztott tájegység</p>
      <h2>{region?.name}</h2>
      <p className="muted">Layer: <strong>{activeLayer}</strong></p>

      {activeLayer === 'architecture' ? (
        <div className="fields">
          <FieldRow label="Falazat" field={layer.wall_material} extractionsById={extractionsById} sourcesById={sourcesById} />
          <FieldRow label="Tetőforma / tetőfedés" field={layer.roof_form} extractionsById={extractionsById} sourcesById={sourcesById} />
          <FieldRow label="Kerítés" field={layer.fence_type} extractionsById={extractionsById} sourcesById={sourcesById} />
          <FieldRow label="Jellegzetes díszítés" field={layer.characteristic_decoration} extractionsById={extractionsById} sourcesById={sourcesById} />
        </div>
      ) : (
        <p className="empty-state">Ehhez a réteghez még nincs pilot adat.</p>
      )}

      <div className="review-actions">
        <button type="button">Approve</button>
        <button type="button" className="secondary">Needs more source</button>
        <button type="button" className="danger">Reject</button>
      </div>
      <p className="muted small">A gombok az MVP-ben még csak UI-elemek; a következő lépésben bekötjük JSON státuszfrissítésre vagy issue/PR workflowra.</p>

      <div className="review-list">
        <h3>Aktuális review kérdések</h3>
        {reviewItems.map((item) => (
          <article key={item.id} className="review-item">
            <strong>{item.id}</strong>
            <p>{item.question}</p>
            <span>{item.recommended_decision}</span>
          </article>
        ))}
      </div>
    </div>
  )
}
