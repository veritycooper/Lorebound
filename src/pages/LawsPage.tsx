import { useNavigate } from 'react-router-dom'
import { EmptyState } from '../components/EmptyState'
import { useStory } from '../context/StoryContext'

export default function LawsPage() {
  const { story, addLegalSystem } = useStory()
  const navigate = useNavigate()

  return (
    <div>
      <header className="page-head">
        <div>
          <p className="eyebrow">What binds a people</p>
          <h1>Laws</h1>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => navigate(addLegalSystem().id)}>
          New legal system
        </button>
      </header>
      {story.legalSystems.length === 0 ? (
        <EmptyState
          title="No code on the table"
          body="A city needs more than swords. Capture courts, customs, and the laws people actually fear."
        />
      ) : (
        <div className="story-grid">
          {story.legalSystems.map((system) => (
            <button
              key={system.id}
              type="button"
              className="entity-card"
              style={{ textAlign: 'left', cursor: 'pointer' }}
              onClick={() => navigate(system.id)}
            >
              <h3>{system.name}</h3>
              <p className="muted small">
                {system.region || 'Region unset'} · {system.laws.length} laws
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
