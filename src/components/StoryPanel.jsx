function precisionLabel(precision) {
  const labels = {
    region: 'régiós elhelyezés',
    settlement_approx: 'településszintű, közelítő pont',
    exact: 'pontos hely',
  }
  return labels[precision] ?? precision
}

export default function StoryPanel({ cards, selectedCard, onSelectCard, regionNote }) {
  return (
    <div className="story-panel">
      {selectedCard && (
        <article className="card featured-card">
          <p className="eyebrow">Kiválasztott érdekesség</p>
          <h2>{selectedCard.title}</h2>
          <div className="meta-row">
            <span>{selectedCard.region}{selectedCard.place ? ` · ${selectedCard.place}` : ''}</span>
            <span>{selectedCard.category}</span>
            <span>{precisionLabel(selectedCard.coordinates.precision)}</span>
          </div>
          <p className="lead-text">{selectedCard.summary}</p>
          <blockquote>{selectedCard.quote}</blockquote>
          <p className="source-line">
            <strong>Forrás:</strong>{' '}
            <a href={selectedCard.source.url} target="_blank" rel="noreferrer">
              {selectedCard.source.title}
            </a>
          </p>
        </article>
      )}

      <section className="card list-card">
        <div className="list-header">
          <div>
            <p className="eyebrow">Térképkártyák</p>
            <h3>{cards.length} forráslinkelt érdekesség</h3>
          </div>
        </div>
        <div className="story-list">
          {cards.map((card) => (
            <button
              key={card.id}
              type="button"
              className={card.id === selectedCard?.id ? 'story-list-item active' : 'story-list-item'}
              onClick={() => onSelectCard(card.id)}
            >
              <span className="story-title">{card.title}</span>
              <span className="story-meta">{card.region} · {card.category}</span>
            </button>
          ))}
        </div>
      </section>

      <p className="muted small review-help">
        {regionNote} Következő körben ezeket a régiófoltokat pontosíthatjuk forrásokkal / történeti atlaszokkal, de az MVP-ben csak tájékozódási overlayként használjuk.
      </p>
    </div>
  )
}
