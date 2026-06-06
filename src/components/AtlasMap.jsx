import { CircleMarker, GeoJSON, MapContainer, Popup, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useEffect, useMemo } from 'react'

const DEFAULT_CENTER = [47.25, 20.4]

const categoryColors = {
  építészet: '#38bdf8',
  díszítés: '#f472b6',
  életmód: '#f97316',
  örökség: '#22c55e',
}

function cardPosition(card) {
  return [card.coordinates.lat, card.coordinates.lng]
}

function FlyToCard({ selectedCard }) {
  const map = useMap()
  useEffect(() => {
    if (selectedCard) {
      map.flyTo(cardPosition(selectedCard), selectedCard.coordinates.precision === 'region' ? 8 : 10, { duration: 0.8 })
    }
  }, [map, selectedCard])
  return null
}

function OverlayLegend({ regionOverlay }) {
  const map = useMap()
  useEffect(() => {
    const control = L.control({ position: 'bottomleft' })
    control.onAdd = () => {
      const div = L.DomUtil.create('div', 'map-legend')
      div.innerHTML = `
        <strong>Régió-overlay</strong><br/>
        <span>Vázlatos tájékozódási foltok, nem pontos határok.</span><br/>
        <small>${regionOverlay.features.length} régió · Magyar Néprajz MVP</small>
      `
      return div
    }
    control.addTo(map)
    return () => control.remove()
  }, [map, regionOverlay.features.length])
  return null
}

export default function AtlasMap({ cards, allCards, regionOverlay, selectedCardId, onSelectCard }) {
  const selectedCard = useMemo(
    () => allCards.find((card) => card.id === selectedCardId),
    [allCards, selectedCardId],
  )

  function regionStyle(feature) {
    return {
      color: feature.properties.color,
      weight: 2,
      opacity: 0.9,
      fillColor: feature.properties.color,
      fillOpacity: 0.12,
      dashArray: '7 6',
    }
  }

  function onEachRegion(feature, layer) {
    const props = feature.properties
    layer.bindPopup(`
      <strong>${props.name}</strong><br/>
      <em>vázlatos régióhatár</em><br/>
      ${props.note ?? ''}
    `)
  }

  return (
    <MapContainer center={DEFAULT_CENTER} zoom={7} minZoom={5} className="atlas-map">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <GeoJSON data={regionOverlay} style={regionStyle} onEachFeature={onEachRegion} />
      <FlyToCard selectedCard={selectedCard} />
      <OverlayLegend regionOverlay={regionOverlay} />

      {cards.map((card) => {
        const isSelected = card.id === selectedCardId
        const color = categoryColors[card.category] ?? '#f8fafc'
        return (
          <CircleMarker
            key={card.id}
            center={cardPosition(card)}
            radius={isSelected ? 11 : 7}
            pathOptions={{
              color: '#0f172a',
              weight: isSelected ? 3 : 2,
              fillColor: color,
              fillOpacity: isSelected ? 1 : 0.86,
            }}
            eventHandlers={{ click: () => onSelectCard(card.id) }}
          >
            <Popup>
              <strong>{card.title}</strong>
              <br />
              {card.region}{card.place ? ` · ${card.place}` : ''}
              <br />
              <span>{card.category} · {card.coordinates.precision}</span>
              <p>{card.summary}</p>
              <a href={card.source.url} target="_blank" rel="noreferrer">forrás</a>
            </Popup>
          </CircleMarker>
        )
      })}
    </MapContainer>
  )
}
