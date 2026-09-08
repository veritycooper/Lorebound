import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { Field } from '../components/Field'
import { useStory } from '../context/StoryContext'
import {
  displayName,
  dropMagicLinksTo,
  linkCharacterToMagic,
  practitionersForSystem,
  unlinkCharacterFromMagic,
} from '../lib/entities'
import type { MagicSystem } from '../types'

export default function MagicEditor() {
  const { entityId } = useParams()
  const navigate = useNavigate()
  const { story, setMagicSystems, setCharacters, updateStory } = useStory()
  const system = story.magicSystems.find((entry) => entry.id === entityId)
  const [pendingDelete, setPendingDelete] = useState(false)

  if (!system) {
    return (
      <div className="empty">
        <h2>System not found</h2>
        <Link className="btn" to="..">
          Back to magic
        </Link>
      </div>
    )
  }

  const id = system.id
  const practitioners = practitionersForSystem(story.characters, id)
  const linkedIds = new Set(practitioners.map((entry) => entry.character.id))
  const availablePeople = story.characters.filter((character) => !linkedIds.has(character.id))

  function patch(next: Partial<MagicSystem>) {
    setMagicSystems(story.magicSystems.map((entry) => (entry.id === id ? { ...entry, ...next } : entry)))
  }

  return (
    <div>
      <div className="back-row">
        <Link className="btn" to="..">
          ← Magic
        </Link>
        <button type="button" className="btn btn-wine" onClick={() => setPendingDelete(true)}>
          Delete
        </button>
      </div>
      <header className="page-head">
        <h1>{system.name.trim() || 'Unnamed system'}</h1>
      </header>
      <div className="paper">
        <div className="stack">
          <Field label="Name">
            <input
              value={system.name}
              placeholder="What do they call this craft?"
              onChange={(event) => patch({ name: event.target.value })}
            />
          </Field>
          <Field label="Rules">
            <textarea value={system.rules} onChange={(event) => patch({ rules: event.target.value })} />
          </Field>
          <Field label="Costs">
            <textarea
              value={system.costs}
              placeholder="Blood, years, luck, a true name…"
              onChange={(event) => patch({ costs: event.target.value })}
            />
          </Field>
          <Field label="Who can use it">
            <textarea value={system.whoCanUse} onChange={(event) => patch({ whoCanUse: event.target.value })} />
          </Field>
          <Field label="Notes">
            <textarea value={system.notes} onChange={(event) => patch({ notes: event.target.value })} />
          </Field>
        </div>

        <section className="editor-section">
          <h2 className="editor-section-title">Practitioners</h2>
          {practitioners.length === 0 ? (
            <p className="hint">No one is linked to this system yet.</p>
          ) : null}
          {practitioners.map(({ character, note }) => (
            <div className="magic-link-row" key={character.id}>
              <Link className="magic-link-name" to={`../../characters/${character.id}`}>
                {displayName(character.name, 'Unnamed character')}
              </Link>
              <input
                className="input"
                placeholder="How they use it, strength…"
                value={note}
                onChange={(event) =>
                  setCharacters(linkCharacterToMagic(story.characters, character.id, id, event.target.value))
                }
              />
              <button
                type="button"
                className="btn btn-small"
                onClick={() => setCharacters(unlinkCharacterFromMagic(story.characters, character.id, id))}
              >
                Remove
              </button>
            </div>
          ))}
          {availablePeople.length ? (
            <Field label="Add a practitioner">
              <select
                value=""
                onChange={(event) => {
                  if (event.target.value) {
                    setCharacters(linkCharacterToMagic(story.characters, event.target.value, id))
                  }
                }}
              >
                <option value="">Choose a character…</option>
                {availablePeople.map((character) => (
                  <option key={character.id} value={character.id}>
                    {displayName(character.name, 'Unnamed character')}
                  </option>
                ))}
              </select>
            </Field>
          ) : story.characters.length === 0 ? (
            <p className="hint">Add a character to this story to link them here.</p>
          ) : null}
        </section>
      </div>
      {pendingDelete ? (
        <ConfirmDialog
          title="Unmake this system?"
          body="The rules will leave this volume, and character links to it will be cleared."
          onCancel={() => setPendingDelete(false)}
          onConfirm={() => {
            updateStory({
              magicSystems: story.magicSystems.filter((entry) => entry.id !== id),
              characters: dropMagicLinksTo(story.characters, id),
            })
            navigate('..')
          }}
        />
      ) : null}
    </div>
  )
}
