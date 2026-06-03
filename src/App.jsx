import { useMemo, useState } from 'react'
import atlasData from './data/atlas-data.json'
import sourcesData from './data/sources.json'
import extractionsData from './data/extractions.json'
import reviewData from './data/review-items.json'
import AtlasMap from './components/AtlasMap.jsx'
import ReviewPanel from './components/ReviewPanel.jsx'
import LayerToggle from './components/LayerToggle.jsx'

const DEFAULT_SELECTED = 'palocfold'

export default function App() {
  const [selectedRegionId, setSelectedRegionId] = useState(DEFAULT_SELECTED)
  const [activeLayer, setActiveLayer] = useState('architecture')

  const selectedRegion = useMemo(
    () => atlasData.regions.find((region) => region.id === selectedRegionId) ?? atlasData.regions[0],
    [selectedRegionId],
  )

  const extractionsById = useMemo(() => {
    return Object.fromEntries(extractionsData.extractions.map((item) => [item.id, item]))
  }, [])

  const sourcesById = useMemo(() => {
    return Object.fromEntries(sourcesData.sources.map((item) => [item.id, item]))
  }, [])

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <p className="eyebrow">Pilot MVP</p>
          <h1>Digitális Kárpát-medencei Néprajzi Atlasz</h1>
          <p className="subtitle">
            Forrásalapú térképes néprajzi adatbázis. Nincs AI-általánosítás: minden tény forráshoz kötött.
          </p>
        </div>

        <LayerToggle activeLayer={activeLayer} onChange={setActiveLayer} />

        <ReviewPanel
          region={selectedRegion}
          activeLayer={activeLayer}
          extractionsById={extractionsById}
          sourcesById={sourcesById}
          reviewItems={reviewData.review_items}
        />
      </aside>

      <section className="map-section">
        <AtlasMap
          regions={atlasData.regions}
          selectedRegionId={selectedRegion?.id}
          onSelectRegion={setSelectedRegionId}
        />
      </section>
    </main>
  )
}
