import { useMemo, useState } from 'react'
import storyCardsData from './data/story-cards.json'
import regionOverlayData from './data/ethnographic-regions.json'
import AtlasMap from './components/AtlasMap.jsx'
import StoryPanel from './components/StoryPanel.jsx'

const DEFAULT_CATEGORY = 'all'

export default function App() {
  const [selectedCardId, setSelectedCardId] = useState(storyCardsData.cards[0]?.id)
  const [activeCategory, setActiveCategory] = useState(DEFAULT_CATEGORY)

  const categories = useMemo(() => {
    return ['all', ...Array.from(new Set(storyCardsData.cards.map((card) => card.category)))]
  }, [])

  const filteredCards = useMemo(() => {
    if (activeCategory === DEFAULT_CATEGORY) return storyCardsData.cards
    return storyCardsData.cards.filter((card) => card.category === activeCategory)
  }, [activeCategory])

  const selectedCard = useMemo(() => {
    return storyCardsData.cards.find((card) => card.id === selectedCardId) ?? filteredCards[0] ?? storyCardsData.cards[0]
  }, [filteredCards, selectedCardId])

  function selectCategory(category) {
    setActiveCategory(category)
    const first = category === DEFAULT_CATEGORY
      ? storyCardsData.cards[0]
      : storyCardsData.cards.find((card) => card.category === category)
    if (first) setSelectedCardId(first.id)
  }

  return (
    <main className="app-shell story-shell">
      <aside className="sidebar story-sidebar">
        <div className="brand-block">
          <p className="eyebrow">MVP · forráslinkelt térkép</p>
          <h1>Kárpát-medencei Néprajzi Térkép</h1>
          <p className="subtitle">
            Kurált néprajzi érdekességek a Magyar Néprajz MEK-es köteteiből. A régióhatárok egyelőre vázlatos overlayek, nem közigazgatási vagy végleges tudományos határok.
          </p>
        </div>

        <div className="category-filter card">
          <p className="eyebrow">Kategóriák</p>
          <div className="chip-row">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                className={category === activeCategory ? 'chip active' : 'chip'}
                onClick={() => selectCategory(category)}
              >
                {category === 'all' ? 'összes' : category}
              </button>
            ))}
          </div>
        </div>

        <StoryPanel
          cards={filteredCards}
          selectedCard={selectedCard}
          onSelectCard={setSelectedCardId}
          regionNote={regionOverlayData.note}
        />
      </aside>

      <section className="map-section">
        <AtlasMap
          cards={filteredCards}
          allCards={storyCardsData.cards}
          regionOverlay={regionOverlayData}
          selectedCardId={selectedCard?.id}
          onSelectCard={setSelectedCardId}
        />
      </section>
    </main>
  )
}
