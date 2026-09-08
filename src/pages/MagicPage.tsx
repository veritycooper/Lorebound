import { useNavigate } from 'react-router-dom'
import { EmptyState } from '../components/EmptyState'
import { useStory } from '../context/StoryContext'
import { displayName } from '../lib/entities'

export default function MagicPage() {
  const { story, addMagicSystem } = useStory()
  const navigate = useNavigate()

  return (
    <div>
      <header className="page-head">
        <div>
          <p className="eyebrow">The rules of wonder</p>
          <h1>Magic</h1>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => navigate(addMagicSystem().id)}
        >
          New system
        </button>
      </header>
      {story.magicSystems.length === 0 ? (
        <EmptyState
          title="No spark yet"
          body="Write what magic costs, who may touch it, and what happens when someone cheats. Systems live beside the story so drafts stay honest."
        />
      ) : (
        <div className="story-grid">
          {story.magicSystems.map((system) => (
            <button
              key={system.id}
              type="button"
              className="entity-card"
              style={{ textAlign: 'left', cursor: 'pointer' }}
              onClick={() => navigate(system.id)}
            >
              <h3>{displayName(system.name, 'Unnamed system')}</h3>
              <p className="muted small">{system.whoCanUse || 'Who can use it is still a mystery.'}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
