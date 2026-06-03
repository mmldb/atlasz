import { useEffect, useMemo, useState } from 'react'

const REVIEW_STORAGE_KEY = 'atlasz-review-decisions-v1'
const REVIEW_REPO_ISSUES_URL = 'https://github.com/mmldb/atlasz/issues/new'

function formatValue(value) {
  if (Array.isArray(value)) return value.join(' / ')
  if (value === null || value === undefined || value === '') return 'nincs adat'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function readStoredDecisions() {
  try {
    return JSON.parse(window.localStorage.getItem(REVIEW_STORAGE_KEY) ?? '{}')
  } catch {
    return {}
  }
}

function makeDecisionKey(regionId, activeLayer, fieldKey, extractionId) {
  return [regionId, activeLayer, fieldKey, extractionId ?? 'no-extraction'].join('::')
}

function makeIssueUrl({ decision, region, activeLayer, fieldKey, label, field, extraction, source }) {
  const title = `[atlas-review] ${decision}: ${region?.name ?? region?.id} / ${activeLayer}.${fieldKey}`
  const body = [
    '## Atlas review döntés',
    '',
    `- Decision: ${decision}`,
    `- Region: ${region?.name ?? ''} (${region?.id ?? ''})`,
    `- Layer/field: ${activeLayer}.${fieldKey}`,
    `- Label: ${label}`,
    `- Current value: ${formatValue(field?.value)}`,
    `- Extraction ID: ${extraction?.id ?? 'n/a'}`,
    `- Source ID: ${source?.id ?? extraction?.source_id ?? 'n/a'}`,
    `- Source: ${source?.author ?? ''}: ${source?.title ?? ''}`,
    `- Locator: ${extraction?.source_locator?.url ?? extraction?.source_locator?.pdf_page_label ?? ''}`,
    '',
    '## Quote',
    '',
    extraction?.quote ?? 'n/a',
    '',
    '## Paraphrase',
    '',
    extraction?.paraphrase ?? 'n/a',
    '',
    '## Hermes feladat',
    '',
    'Vezesd át ezt a review döntést a JSON adatokba, majd készíts commitot.',
  ].join('\n')

  const params = new URLSearchParams({ title, body })
  return `${REVIEW_REPO_ISSUES_URL}?${params.toString()}`
}

function ReviewButtons({ region, activeLayer, fieldKey, label, field, extraction, source, decision, onDecision }) {
  if (!extraction) return null

  function handleDecision(nextDecision) {
    onDecision(nextDecision)
    window.location.href = makeIssueUrl({
      decision: nextDecision,
      region,
      activeLayer,
      fieldKey,
      label,
      field,
      extraction,
      source,
    })
  }

  return (
    <div className="review-actions field-review-actions">
      <button type="button" onClick={() => handleDecision('approved')}>Approve</button>
      <button type="button" className="secondary" onClick={() => handleDecision('needs_more_source')}>Needs more source</button>
      <button type="button" className="danger" onClick={() => handleDecision('rejected')}>Reject</button>
      {decision && (
        <p className="decision-note">Ezen az eszközön jelölve: <strong>{decision}</strong>. A véglegesítéshez a megnyíló GitHub issue-t küldd be.</p>
      )}
    </div>
  )
}

function FieldRow({ region, activeLayer, fieldKey, label, field, extractionsById, sourcesById, decision, onDecision }) {
  const extractionIds = field?.source_extraction_ids ?? []
  const extraction = extractionIds.length ? extractionsById[extractionIds[0]] : null
  const source = extraction ? sourcesById[extraction.source_id] : null
  const displayStatus = decision ?? field?.verification_status ?? 'empty'

  return (
    <div className={`field-row ${decision ? 'has-local-decision' : ''}`}>
      <div className="field-header">
        <span>{label}</span>
        <span className={`status-pill status-${displayStatus}`}>
          {displayStatus}
        </span>
      </div>
      <p className="field-value">{formatValue(field?.value)}</p>
      {extraction && (
        <details className="source-details">
          <summary>Forrás / bizonyíték</summary>
          <blockquote>{extraction.quote}</blockquote>
          <p><strong>Értelmezés:</strong> {extraction.paraphrase}</p>
          <p><strong>Forrás:</strong> {source?.author}: <em>{source?.title}</em></p>
          {extraction.source_locator?.url ? (
            <p><strong>Lokátor:</strong> <a href={extraction.source_locator.url} target="_blank" rel="noreferrer">{extraction.source_locator.url}</a></p>
          ) : (
            <p><strong>Lokátor:</strong> PDF oldal {extraction.source_locator?.pdf_page_label}, szövegsorok {extraction.source_locator?.text_lines?.join('–')}</p>
          )}
        </details>
      )}
      <ReviewButtons
        region={region}
        activeLayer={activeLayer}
        fieldKey={fieldKey}
        label={label}
        field={field}
        extraction={extraction}
        source={source}
        decision={decision}
        onDecision={onDecision}
      />
    </div>
  )
}

export default function ReviewPanel({ region, activeLayer, extractionsById, sourcesById, reviewItems }) {
  const layer = region?.layers?.[activeLayer] ?? {}
  const [decisions, setDecisions] = useState({})

  useEffect(() => {
    setDecisions(readStoredDecisions())
  }, [])

  const fieldDefinitions = useMemo(() => {
    if (activeLayer !== 'architecture') return []
    return [
      ['wall_material', 'Falazat'],
      ['roof_form', 'Tetőforma / tetőfedés'],
      ['fence_type', 'Kerítés'],
      ['characteristic_decoration', 'Jellegzetes díszítés'],
    ]
  }, [activeLayer])

  function setFieldDecision(fieldKey, field, decision) {
    const extractionId = field?.source_extraction_ids?.[0]
    const key = makeDecisionKey(region?.id, activeLayer, fieldKey, extractionId)
    const next = { ...decisions, [key]: decision }
    setDecisions(next)
    window.localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(next))
  }

  return (
    <div className="card review-panel">
      <p className="eyebrow">Kiválasztott tájegység</p>
      <h2>{region?.name}</h2>
      <p className="muted">Layer: <strong>{activeLayer}</strong></p>

      {fieldDefinitions.length ? (
        <div className="fields">
          {fieldDefinitions.map(([fieldKey, label]) => {
            const field = layer[fieldKey]
            const extractionId = field?.source_extraction_ids?.[0]
            const decisionKey = makeDecisionKey(region?.id, activeLayer, fieldKey, extractionId)
            return (
              <FieldRow
                key={fieldKey}
                region={region}
                activeLayer={activeLayer}
                fieldKey={fieldKey}
                label={label}
                field={field}
                extractionsById={extractionsById}
                sourcesById={sourcesById}
                decision={decisions[decisionKey]}
                onDecision={(decision) => setFieldDecision(fieldKey, field, decision)}
              />
            )
          })}
        </div>
      ) : (
        <p className="empty-state">Ehhez a réteghez még nincs pilot adat.</p>
      )}

      <p className="muted small review-help">
        Az Approve / Reject gomb most már működik: helyben megjelöli a döntést, majd megnyit egy előre kitöltött GitHub issue-t. Ott nyomd meg a <strong>Submit new issue</strong> gombot, és én átvezetem a JSON-ba.
      </p>

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
