const layers = [
  { id: 'architecture', label: 'Építészet' },
  { id: 'costume_female', label: 'Női viselet' },
  { id: 'costume_male', label: 'Férfi viselet' },
]

export default function LayerToggle({ activeLayer, onChange }) {
  return (
    <div className="card layer-toggle">
      <h2>Rétegek</h2>
      <div className="segmented-control">
        {layers.map((layer) => (
          <button
            key={layer.id}
            className={layer.id === activeLayer ? 'active' : ''}
            type="button"
            onClick={() => onChange(layer.id)}
          >
            {layer.label}
          </button>
        ))}
      </div>
    </div>
  )
}
