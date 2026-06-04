import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useEffect } from 'react'

const FALLBACK_COORDINATES = {
  palocfold: [48.05, 19.75],
  sarkoz: [46.35, 18.75],
  kalotaszeg: [46.85, 23.05],
}

const statusColors = {
  candidate_for_map_review: '#38bdf8',
  candidate_for_atlas: '#38bdf8',
  pending_human_review: '#f5a623',
  partial_pending_review: '#f5a623',
  partial_approved_with_pending_review: '#84cc16',
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

function makePointIcon(status) {
  const color = statusColors[status] ?? '#38bdf8'
  return L.divIcon({
    className: '',
    html: `<div class="source-point-marker" style="--marker-color:${color}"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  })
}

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

function FlyToSelected({ regions, selectedRegionId }) {
  const map = useMap()
  useEffect(() => {
    const region = regions.find((item) => item.id === selectedRegionId)
    if (region) map.flyTo(getRegionPosition(region), 8, { duration: 0.7 })
  }, [map, regions, selectedRegionId])
  return null
}

export default function AtlasMap({ regions, mapPoints = [], extractionsById = {}, selectedRegionId, onSelectRegion }) {
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
      {mapPoints.map((point) => {
        const extraction = extractionsById[point.source_extraction_id]
        const position = [point.coordinates.lat, point.coordinates.lng]
        return (
          <Marker
            key={point.id}
            position={position}
            icon={makePointIcon(point.verification_status)}
            eventHandlers={{ click: () => onSelectRegion(point.region_id) }}
          >
            <Popup>
              <strong>{point.label}</strong>
              <br />
              Status: {point.verification_status}
              <br />
              Pontosság: {point.coordinates.precision}
              <br />
              <span>{formatValue(extraction?.proposed_value)}</span>
              {extraction?.source_locator?.url && (
                <>
                  <br />
                  <a href={extraction.source_locator.url} target="_blank" rel="noreferrer">forrás</a>
                </>
              )}
            </Popup>
          </Marker>
        )
      })}
    </MapContainer>
  )
}
