import { useEffect, useMemo, useState } from 'react'

const REVIEW_STORAGE_KEY = 'atlasz-review-decisions-v1'

function formatValue(value) {
  if (Array.isArray(value)) return value.join(' / ')
  if (value === null || value === undefined || value === '') return 'nincs adat'
  if (typeof value === 'object') {
    return Object.entries(value)
      .map(([key, item]) => `${key}: ${formatValue(item)}`)
      .join(' | ')
  }
  return String(value)
}

function readStoredDecisions() {
  try {
    return JSON.parse(window.localStorage.getItem(REVIEW_STORAGE_KEY) ?? '{}')
  } catch {
    return {}
  }
}

function makeDecisionKey(regionId, activeLayer, extractionId, fieldKey = 'candidate') {
  return [regionId, activeLayer, fieldKey, extractionId ?? 'no-extraction'].join('::')
}

function sourceLocatorText(locator = {}) {
  if (locator.url) return locator.url
  if (locator.hungaricana_pg) return `Hungaricana pg=${locator.hungaricana_pg}`
  if (locator.pdf_page_label) return `PDF oldal ${locator.pdf_page_label}`
  if (locator.section) return locator.section
  return 'n/a'
}

function makeHermesReviewMessage({ decision, region, activeLayer, fieldKey, label, extraction, source }) {
  return [
    `ATLASZ REVIEW: ${decision}`,
    `Region: ${region?.name ?? ''} (${region?.id ?? ''})`,
    `Layer/field: ${activeLayer}.${fieldKey ?? extraction?.field_candidates?.join(',') ?? 'candidate'}`,
    `Label: ${label ?? ''}`,
    `Extraction ID: ${extraction?.id ?? 'n/a'}`,
    `Source: ${source?.author ?? ''}: ${source?.title ?? ''}`,
    `Locator: ${sourceLocatorText(extraction?.source_locator)}`,
    `Proposed value: ${formatValue(extraction?.proposed_value)}`,
    '',
    `Quote: ${extraction?.quote ?? 'n/a'}`,
    '',
    `Paraphrase: ${extraction?.paraphrase ?? 'n/a'}`,
    '',
    'Hermes: ezt vezesd át a JSON adatokba és commitold.',
  ].join('\n')
}

function ReviewButtons({ region, activeLayer, fieldKey, label, extraction, source, decision, onDecision }) {
  const [message, setMessage] = useState('')
  const [copyState, setCopyState] = useState('')

  if (!extraction) return null

  async function handleDecision(nextDecision) {
    const reviewMessage = makeHermesReviewMessage({
      decision: nextDecision,
      region,
      activeLayer,
      fieldKey,
      label,
      extraction,
      source,
    })

    onDecision(nextDecision)
    setMessage(reviewMessage)
    setCopyState('')

    if (navigator.share) {
      try {
        await navigator.share({ title: `Atlasz review: ${nextDecision}`, text: reviewMessage })
        setCopyState('Megosztás elindítva.')
        return
      } catch {
        // User cancelled or share failed; fall back to clipboard/text box.
      }
    }

    try {
      await navigator.clipboard.writeText(reviewMessage)
      setCopyState('Kimásolva. Illeszd be ide Telegramon, és átvezetem.')
    } catch {
      setCopyState('Másold ki az alábbi szöveget, és küldd el Telegramon.')
    }
  }

  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(message)
      setCopyState('Kimásolva.')
    } catch {
      setCopyState('Nem sikerült automatikusan másolni, jelöld ki kézzel.')
    }
  }

  return (
    <div className="review-actions field-review-actions">
      <button type="button" onClick={() => handleDecision('approved')}>Approve</button>
      <button type="button" className="secondary" onClick={() => handleDecision('needs_more_source')}>Needs more source</button>
      <button type="button" className="danger" onClick={() => handleDecision('rejected')}>Reject</button>
      {decision && (
        <p className="decision-note">Ezen az eszközön jelölve: <strong>{decision}</strong></p>
      )}
      {copyState && <p className="decision-note">{copyState}</p>}
      {message && (
        <div className="review-message-box">
          <button type="button" className="secondary" onClick={copyMessage}>Review üzenet másolása</button>
          <textarea readOnly value={message} rows={7} />
        </div>
      )}
    </div>
  )
}

function EvidenceBlock({ extraction, source }) {
  if (!extraction) return null
  return (
    <details className="source-details">
      <summary>Forrás / bizonyíték</summary>
      <blockquote>{extraction.quote}</blockquote>
      <p><strong>Értelmezés:</strong> {extraction.paraphrase}</p>
      <p><strong>Javasolt érték:</strong> {formatValue(extraction.proposed_value)}</p>
      <p><strong>Forrás:</strong> {source?.author}: <em>{source?.title}</em></p>
      {extraction.source_locator?.url ? (
        <p><strong>Lokátor:</strong> <a href={extraction.source_locator.url} target="_blank" rel="noreferrer">{extraction.source_locator.url}</a></p>
      ) : (
        <p><strong>Lokátor:</strong> {sourceLocatorText(extraction.source_locator)}</p>
      )}
    </details>
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
        <span className={`status-pill status-${displayStatus}`}>{displayStatus}</span>
      </div>
      <p className="field-value">{formatValue(field?.value)}</p>
      <EvidenceBlock extraction={extraction} source={source} />
      <ReviewButtons
        region={region}
        activeLayer={activeLayer}
        fieldKey={fieldKey}
        label={label}
        extraction={extraction}
        source={source}
        decision={decision}
        onDecision={onDecision}
      />
    </div>
  )
}

function CandidateCard({ region, activeLayer, reviewItem, extraction, source, decision, onDecision }) {
  if (!extraction) return null
  const fieldLabel = extraction.field_candidates?.join(' / ') ?? 'candidate'
  return (
    <article className={`candidate-card ${decision ? 'has-local-decision' : ''}`}>
      <div className="field-header">
        <span>{fieldLabel}</span>
        <span className={`status-pill status-${decision ?? extraction.status}`}>{decision ?? extraction.status}</span>
      </div>
      <p className="candidate-question">{reviewItem?.question}</p>
      <p className="field-value">{formatValue(extraction.proposed_value)}</p>
      <EvidenceBlock extraction={extraction} source={source} />
      <ReviewButtons
        region={region}
        activeLayer={activeLayer}
        fieldKey={fieldLabel}
        label={reviewItem?.id ?? extraction.id}
        extraction={extraction}
        source={source}
        decision={decision}
        onDecision={onDecision}
      />
    </article>
  )
}

export default function ReviewPanel({ region, activeLayer, extractions, extractionsById, sourcesById, reviewItems }) {
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

  const candidateReviewItems = useMemo(() => {
    return reviewItems
      .map((item) => ({ item, extraction: item.evidence_extraction_id ? extractionsById[item.evidence_extraction_id] : null }))
      .filter(({ extraction }) => {
        if (!extraction) return false
        return extraction.region_candidates?.includes(region?.id) && extraction.layer_candidates?.includes(activeLayer)
      })
  }, [activeLayer, extractionsById, region?.id, reviewItems])

  const backgroundConcepts = useMemo(() => {
    return extractions.filter((extraction) => {
      return extraction.status === 'background_concept_only' && extraction.layer_candidates?.includes(activeLayer)
    })
  }, [activeLayer, extractions])

  function setDecision(extractionId, decision, fieldKey = 'candidate') {
    const key = makeDecisionKey(region?.id, activeLayer, extractionId, fieldKey)
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
          <h3>Atlaszban lévő mezők</h3>
          {fieldDefinitions.map(([fieldKey, label]) => {
            const field = layer[fieldKey]
            const extractionId = field?.source_extraction_ids?.[0]
            const decisionKey = makeDecisionKey(region?.id, activeLayer, extractionId, fieldKey)
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
                onDecision={(decision) => setDecision(extractionId, decision, fieldKey)}
              />
            )
          })}
        </div>
      ) : (
        <p className="empty-state">Ehhez a réteghez még nincs atlaszba emelt pilot adat.</p>
      )}

      <section className="candidate-list">
        <h3>Jóváhagyásra váró kinyert adatok</h3>
        {candidateReviewItems.length ? candidateReviewItems.map(({ item, extraction }) => {
          const source = sourcesById[extraction.source_id]
          const decisionKey = makeDecisionKey(region?.id, activeLayer, extraction.id, extraction.field_candidates?.join('/'))
          return (
            <CandidateCard
              key={item.id}
              region={region}
              activeLayer={activeLayer}
              reviewItem={item}
              extraction={extraction}
              source={source}
              decision={decisions[decisionKey]}
              onDecision={(decision) => setDecision(extraction.id, decision, extraction.field_candidates?.join('/'))}
            />
          )
        }) : (
          <p className="empty-state">Nincs ehhez a tájegységhez és réteghez review-ra váró kinyert adat.</p>
        )}
      </section>

      {backgroundConcepts.length > 0 && (
        <section className="candidate-list">
          <h3>Háttérfogalmak, nem régiós atlasz-adatok</h3>
          {backgroundConcepts.map((extraction) => (
            <article key={extraction.id} className="candidate-card background-card">
              <div className="field-header">
                <span>{extraction.field_candidates?.join(' / ')}</span>
                <span className="status-pill status-background_concept_only">background</span>
              </div>
              <p className="field-value">{formatValue(extraction.proposed_value)}</p>
              <EvidenceBlock extraction={extraction} source={sourcesById[extraction.source_id]} />
            </article>
          ))}
        </section>
      )}

      <p className="muted small review-help">
        Biztonság miatt a publikus GitHub Pages app nem írhat közvetlenül a JSON-ba. Az Approve most helyben jelöli a döntést, majd Share/Copy üzenetet ad. Küldd el nekem itt Telegramon, és átvezetem a repóban.
      </p>
    </div>
  )
}
