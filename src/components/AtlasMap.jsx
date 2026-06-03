import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useEffect } from 'react'

const FALLBACK_COORDINATES = {
  palocfold: [48.05, 19.75],
  sarkoz: [46.35, 18.75],
  kalotaszeg: [46.85, 23.05],
}

const statusColors = {
  pending_human_review: '#f5a623',
  partial_pending_review: '#f5a623',
  unverified_empty_seed: '#94a3b8',
  approved: '#22c55e',
  rejected: '#ef4444',
}

function getRegionPosition(region) {
  if (region.coordinates?.lat && region.coordinates?.lng) {
    return [region.coordinates.lat, region.coordinates.lng]
  }
  return FALLBACK_COORDINATES[region.id] ?? [47.1, 19.4]
}

function getRegionStatus(region) {
  return region.layers?.metadata?.verification_status ?? 'unverified_empty_seed'
}

function makeIcon(status, selected) {
  const color = statusColors[status] ?? '#38bdf8'
  return L.divIcon({
    className: '',
    html: `<div class="atlas-marker ${selected ? 'is-selected' : ''}" style="--marker-color:${color}"></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  })
}

function FlyToSelected({ regions, selectedRegionId }) {
  const map = useMap()
  useEffect(() => {
    const region = regions.find((item) => item.id === selectedRegionId)
    if (region) map.flyTo(getRegionPosition(region), 8, { duration: 0.7 })
  }, [map, regions, selectedRegionId])
  return null
}

export default function AtlasMap({ regions, selectedRegionId, onSelectRegion }) {
  return (
    <MapContainer center={[47.1, 19.4]} zoom={7} minZoom={5} className="atlas-map">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FlyToSelected regions={regions} selectedRegionId={selectedRegionId} />
      {regions.map((region) => {
        const status = getRegionStatus(region)
        const arch = region.layers?.architecture ?? {}
        return (
          <Marker
            key={region.id}
            position={getRegionPosition(region)}
            icon={makeIcon(status, region.id === selectedRegionId)}
            eventHandlers={{ click: () => onSelectRegion(region.id) }}
          >
            <Popup>
              <strong>{region.name}</strong>
              <br />
              Status: {status}
              <br />
              Falazat: {Array.isArray(arch.wall_material?.value) ? arch.wall_material.value.join(' / ') : arch.wall_material?.value ?? 'nincs adat'}
            </Popup>
          </Marker>
        )
      })}
    </MapContainer>
  )
}
