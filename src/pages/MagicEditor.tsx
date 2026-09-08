import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { Field } from '../components/Field'
import { useStory } from '../context/StoryContext'
import type { MagicSystem } from '../types'

export default function MagicEditor() {
  const { entityId } = useParams()
  const navigate = useNavigate()
  const { story, setMagicSystems } = useStory()
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
        <h1>{system.name}</h1>
      </header>
      <div className="paper">
        <div className="stack">
          <Field label="Name">
            <input value={system.name} onChange={(event) => patch({ name: event.target.value })} />
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
      </div>
      {pendingDelete ? (
        <ConfirmDialog
          title="Unmake this system?"
          body="The rules will leave this volume."
          onCancel={() => setPendingDelete(false)}
          onConfirm={() => {
            setMagicSystems(story.magicSystems.filter((entry) => entry.id !== id))
            navigate('..')
          }}
        />
      ) : null}
    </div>
  )
}
