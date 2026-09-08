import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { Field } from '../components/Field'
import { GraphCanvas } from '../components/GraphCanvas'
import { ImageUpload } from '../components/ImageUpload'
import { useStory } from '../context/StoryContext'
import {
  displayName,
  dropRelationshipsTo,
  emptyRelationship,
  parseRelationshipTarget,
  relationshipTargetValue,
} from '../lib/entities'
import { buildLocalGraph, graphNodeId, parseGraphNodeId } from '../lib/graph'
import type { Character, Relationship } from '../types'

export default function CharacterEditor() {
  const { entityId } = useParams()
  const navigate = useNavigate()
  const { story, setCharacters, saveImageFile, removeImage } = useStory()
  const character = story.characters.find((entry) => entry.id === entityId)
  const [pendingDelete, setPendingDelete] = useState(false)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)

  const localGraph = useMemo(() => {
    if (!character) return { nodes: [], edges: [] }
    return buildLocalGraph(story, { kind: 'character', entityId: character.id })
  }, [character, story])

  if (!character) {
    return (
      <div className="empty">
        <h2>Character not found</h2>
        <Link className="btn" to=".." relative="path">
          Back to the company
        </Link>
      </div>
    )
  }

  const current = character
  const focusId = graphNodeId('character', current.id)

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

  function openGraphNode(nodeId: string) {
    const parsed = parseGraphNodeId(nodeId)
    if (!parsed || parsed.entityId === current.id) return
    if (parsed.kind === 'character') navigate(`/story/${story.id}/characters/${parsed.entityId}`)
    else navigate(`/story/${story.id}/places/${parsed.entityId}`)
  }

  const otherPeople = story.characters.filter((other) => other.id !== character.id)
  const canLink = otherPeople.length + story.places.length > 0

  return (
    <div>
      <div className="back-row">
        <Link className="btn" to=".." relative="path">
          ← Company
        </Link>
        <button type="button" className="btn btn-wine" onClick={() => setPendingDelete(true)}>
          Delete
        </button>
      </div>
      <div className="split-editor">
        <div className="stack character-identity-col">
          <ImageUpload
            imageId={character.imageId}
            label={character.name}
            onUpload={(file) => void onUpload(file)}
            onClear={() => void onClearImage()}
          />
          <div>
            <h1 className="character-side-name">{displayName(character.name, 'Unnamed character')}</h1>
            <p className="muted small">{character.role || 'Role unwritten'}</p>
          </div>
        </div>
        <div className="paper">
          <section className="editor-section">
            <h2 className="editor-section-title">Identity</h2>
            <div className="stack">
              <Field label="Name">
                <input
                  value={character.name}
                  placeholder="What are they called?"
                  onChange={(event) => patch({ name: event.target.value })}
                />
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
          </section>

          <section className="editor-section">
            <h2 className="editor-section-title">Relationships</h2>
            <div className="relation-split">
              <div>
                {character.relationships.map((rel) => (
                  <div className="relation-row" key={rel.id}>
                    <select
                      className="select"
                      value={relationshipTargetValue(rel)}
                      onChange={(event) =>
                        updateRelationship(rel.id, parseRelationshipTarget(event.target.value))
                      }
                    >
                      <option value="">Someone or somewhere…</option>
                      {otherPeople.length ? (
                        <optgroup label="People">
                          {otherPeople.map((other) => (
                            <option key={other.id} value={`character:${other.id}`}>
                              {displayName(other.name, 'Unnamed character')}
                            </option>
                          ))}
                        </optgroup>
                      ) : null}
                      {story.places.length ? (
                        <optgroup label="Places">
                          {story.places.map((place) => (
                            <option key={place.id} value={`place:${place.id}`}>
                              {displayName(place.name, 'Unnamed place')}
                            </option>
                          ))}
                        </optgroup>
                      ) : null}
                    </select>
                    <input
                      className="input"
                      placeholder="lives in, rivals, allied…"
                      value={rel.kind}
                      onChange={(event) => updateRelationship(rel.id, { kind: event.target.value })}
                    />
                    <button
                      type="button"
                      className="btn btn-small"
                      onClick={() =>
                        patch({
                          relationships: character.relationships.filter((entry) => entry.id !== rel.id),
                        })
                      }
                    >
                      Remove
                    </button>
                    <input
                      className="input"
                      style={{ gridColumn: '1 / -1' }}
                      placeholder="Notes (optional)"
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
                      relationships: [...character.relationships, emptyRelationship()],
                    })
                  }
                >
                  Add relationship
                </button>
                {!canLink ? (
                  <p className="hint" style={{ marginTop: '0.7rem' }}>
                    Add another character or a place to hang a link on.
                  </p>
                ) : null}
              </div>
              <div className="local-graph-wrap">
                <GraphCanvas
                  className="local-graph"
                  nodes={localGraph.nodes}
                  edges={localGraph.edges}
                  selectedId={selectedNode ?? focusId}
                  focusId={focusId}
                  layout="star"
                  panZoom={false}
                  onSelect={setSelectedNode}
                  onOpen={(node) => openGraphNode(node.id)}
                />
                <p className="hint local-graph-caption">This person and one hop of links.</p>
              </div>
            </div>
          </section>

          <section className="editor-section">
            <h2 className="editor-section-title">Notes</h2>
            <Field label="Private notes">
              <textarea
                value={character.notes}
                onChange={(event) => patch({ notes: event.target.value })}
              />
            </Field>
          </section>
        </div>
      </div>

      {pendingDelete ? (
        <ConfirmDialog
          title={`Let ${character.name} go?`}
          body="Their notes and portrait leave this volume. You can export first if you want a copy."
          onCancel={() => setPendingDelete(false)}
          onConfirm={() => {
            if (character.imageId) void removeImage(character.imageId)
            setCharacters(
              dropRelationshipsTo(
                story.characters.filter((entry) => entry.id !== character.id),
                'character',
                character.id,
              ),
            )
            navigate('..', { relative: 'path' })
          }}
        />
      ) : null}
    </div>
  )
}
