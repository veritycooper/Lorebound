import { Link, useNavigate } from 'react-router-dom'
import { EmptyState } from '../components/EmptyState'
import { useImageUrl } from '../hooks/useImageUrl'
import { useStory } from '../context/StoryContext'
import type { Character } from '../types'
import { displayName, formatHeight } from '../lib/entities'

export default function CharactersPage() {
  const { story, addCharacter } = useStory()
  const navigate = useNavigate()

  return (
    <div>
      <header className="page-head">
        <div>
          <p className="eyebrow">The company</p>
          <h1>Characters</h1>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            const created = addCharacter()
            navigate(created.id)
          }}
        >
          New character
        </button>
      </header>

      {story.characters.length === 0 ? (
        <EmptyState
          title="No one has entered yet"
          body="Invite a protagonist, a gossip, a ghost. Upload a portrait you saved from Pinterest — Lorebound will keep the file here, not a hotlink."
        />
      ) : (
        <div className="story-grid">
          {story.characters.map((character) => (
            <CharacterCard key={character.id} character={character} />
          ))}
        </div>
      )}
    </div>
  )
}

function CharacterCard({ character }: { character: Character }) {
  const url = useImageUrl(character.imageId)
  return (
    <Link className="entity-card" to={character.id}>
      {url ? (
        <img className="portrait" src={url} alt="" style={{ marginBottom: '0.8rem', maxHeight: 220, objectFit: 'cover' }} />
      ) : (
        <div className="portrait-placeholder" style={{ marginBottom: '0.8rem', minHeight: 120, aspectRatio: '16 / 9' }}>
          {displayName(character.name, '?').slice(0, 1)}
        </div>
      )}
      <h3>{displayName(character.name, 'Unnamed character')}</h3>
      <p className="muted small">{character.role || 'Role unwritten'}</p>
      {character.species.trim() || character.height ? (
        <p className="muted small">
          {[character.species.trim(), formatHeight(character.height)].filter(Boolean).join(' · ')}
        </p>
      ) : null}
    </Link>
  )
}
