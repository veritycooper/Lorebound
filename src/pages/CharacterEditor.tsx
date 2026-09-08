import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { Field } from '../components/Field'
import { ImageUpload } from '../components/ImageUpload'
import { useStory } from '../context/StoryContext'
import { createId } from '../lib/ids'
import type { Character, Relationship } from '../types'

export default function CharacterEditor() {
  const { entityId } = useParams()
  const navigate = useNavigate()
  const { story, setCharacters, saveImageFile, removeImage } = useStory()
  const character = story.characters.find((entry) => entry.id === entityId)
  const [pendingDelete, setPendingDelete] = useState(false)

  if (!character) {
    return (
      <div className="empty">
        <h2>Character not found</h2>
        <Link className="btn" to="..">
          Back to the company
        </Link>
      </div>
    )
  }

  const current = character

  function patch(next: Partial<Character>) {
    setCharacters(
      story.characters.map((entry) => (entry.id === current.id ? { ...entry, ...next } : entry)),
    )
  }

  async function onUpload(file: File) {
    const imageId = await saveImageFile(file)
    if (current.imageId) await removeImage(current.imageId)
    patch({ imageId })
  }

  async function onClearImage() {
    if (current.imageId) await removeImage(current.imageId)
    patch({ imageId: null })
  }

  function updateRelationship(id: string, next: Partial<Relationship>) {
    patch({
      relationships: current.relationships.map((rel) => (rel.id === id ? { ...rel, ...next } : rel)),
    })
  }

  return (
    <div>
      <div className="back-row">
        <Link className="btn" to="..">
          ← Company
        </Link>
        <button type="button" className="btn btn-wine" onClick={() => setPendingDelete(true)}>
          Delete
        </button>
      </div>
      <header className="page-head">
        <h1>{character.name || 'Unnamed character'}</h1>
      </header>
      <div className="split-editor">
        <div className="stack">
          <ImageUpload
            imageId={character.imageId}
            label={character.name}
            onUpload={(file) => void onUpload(file)}
            onClear={() => void onClearImage()}
          />
        </div>
        <div className="paper">
          <div className="stack">
            <Field label="Name">
              <input value={character.name} onChange={(event) => patch({ name: event.target.value })} />
            </Field>
            <Field label="Role">
              <input
                value={character.role}
                placeholder="Protagonist, rival, innkeeper…"
                onChange={(event) => patch({ role: event.target.value })}
              />
            </Field>
            <Field label="Aliases">
              <input
                value={character.aliases}
                placeholder="Names they answer to, or refuse"
                onChange={(event) => patch({ aliases: event.target.value })}
              />
            </Field>
            <Field label="Appearance">
              <textarea
                value={character.appearance}
                onChange={(event) => patch({ appearance: event.target.value })}
              />
            </Field>
            <Field label="Personality">
              <textarea
                value={character.personality}
                onChange={(event) => patch({ personality: event.target.value })}
              />
            </Field>
            <Field label="Notes">
              <textarea value={character.notes} onChange={(event) => patch({ notes: event.target.value })} />
            </Field>
            <Field label="Pinterest reference (optional)">
              <input
                value={character.pinterestUrl}
                placeholder="https://pin.it/… — stored as a link, never scraped"
                onChange={(event) => patch({ pinterestUrl: event.target.value })}
              />
            </Field>
            {character.pinterestUrl.trim() ? (
              <a href={character.pinterestUrl} target="_blank" rel="noreferrer">
                Open reference
              </a>
            ) : null}
          </div>
        </div>
      </div>

      <section style={{ marginTop: '1.6rem' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '0.8rem' }}>Relationships</h2>
        {character.relationships.map((rel) => (
          <div className="relation-row" key={rel.id}>
            <select
              className="select"
              value={rel.otherCharacterId}
              onChange={(event) => updateRelationship(rel.id, { otherCharacterId: event.target.value })}
            >
              <option value="">Someone…</option>
              {story.characters
                .filter((other) => other.id !== character.id)
                .map((other) => (
                  <option key={other.id} value={other.id}>
                    {other.name}
                  </option>
                ))}
            </select>
            <input
              className="input"
              placeholder="Mentor, rival, spouse…"
              value={rel.kind}
              onChange={(event) => updateRelationship(rel.id, { kind: event.target.value })}
            />
            <button
              type="button"
              className="btn btn-small"
              onClick={() =>
                patch({ relationships: character.relationships.filter((entry) => entry.id !== rel.id) })
              }
            >
              Remove
            </button>
            <input
              className="input"
              style={{ gridColumn: '1 / -1' }}
              placeholder="Notes"
              value={rel.notes}
              onChange={(event) => updateRelationship(rel.id, { notes: event.target.value })}
            />
          </div>
        ))}
        <button
          type="button"
          className="btn"
          onClick={() =>
            patch({
              relationships: [
                ...character.relationships,
                { id: createId(), otherCharacterId: '', kind: '', notes: '' },
              ],
            })
          }
        >
          Add relationship
        </button>
      </section>

      {pendingDelete ? (
        <ConfirmDialog
          title={`Let ${character.name} go?`}
          body="Their notes and portrait leave this volume. You can export first if you want a copy."
          onCancel={() => setPendingDelete(false)}
          onConfirm={() => {
            if (character.imageId) void removeImage(character.imageId)
            setCharacters(story.characters.filter((entry) => entry.id !== character.id))
            navigate('..')
          }}
        />
      ) : null}
    </div>
  )
}
