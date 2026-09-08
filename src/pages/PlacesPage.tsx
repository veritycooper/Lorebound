import { useNavigate } from 'react-router-dom'
import { EmptyState } from '../components/EmptyState'
import { useImageUrl } from '../hooks/useImageUrl'
import { useStory } from '../context/StoryContext'
import { PLACE_TYPES } from '../types'
import type { Place } from '../types'
import { displayName } from '../lib/entities'

export default function PlacesPage() {
  const { story, addPlace } = useStory()
  const navigate = useNavigate()

  return (
    <div>
      <header className="page-head">
        <div>
          <p className="eyebrow">Ground and gazetteer</p>
          <h1>Places</h1>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => navigate(addPlace().id)}>
          New place
        </button>
      </header>
      {story.places.length === 0 ? (
        <EmptyState
          title="The map is still blank"
          body="Name a city, a kitchen, a stretch of marsh. Upload a map image you already have — this is a gazetteer, not a cartography studio."
        />
      ) : (
        <div className="story-grid">
          {story.places.map((place) => (
            <PlaceCard key={place.id} place={place} onOpen={() => navigate(place.id)} />
          ))}
        </div>
      )}
    </div>
  )
}

function PlaceCard({ place, onOpen }: { place: Place; onOpen: () => void }) {
  const url = useImageUrl(place.mapImageId)
  const typeLabel = PLACE_TYPES.find((entry) => entry.value === place.type)?.label ?? place.type
  return (
    <button type="button" className="entity-card" style={{ textAlign: 'left', cursor: 'pointer' }} onClick={onOpen}>
      {url ? (
        <img className="map-preview" src={url} alt="" style={{ marginBottom: '0.8rem' }} />
      ) : null}
      <span className="chip">{typeLabel}</span>
      <h3>{displayName(place.name, 'Unnamed place')}</h3>
      <p className="muted small">{place.description || 'Awaiting description.'}</p>
    </button>
  )
}
