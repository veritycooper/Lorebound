import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { Field } from '../components/Field'
import { useStory } from '../context/StoryContext'
import { createId } from '../lib/ids'
import type { Law, LegalSystem } from '../types'

export default function LawEditor() {
  const { entityId } = useParams()
  const navigate = useNavigate()
  const { story, setLegalSystems } = useStory()
  const system = story.legalSystems.find((entry) => entry.id === entityId)
  const [pendingDelete, setPendingDelete] = useState(false)

  if (!system) {
    return (
      <div className="empty">
        <h2>Legal system not found</h2>
        <Link className="btn" to="..">
          Back to laws
        </Link>
      </div>
    )
  }

  const current = system
  const id = current.id

  function patch(next: Partial<LegalSystem>) {
    setLegalSystems(story.legalSystems.map((entry) => (entry.id === id ? { ...entry, ...next } : entry)))
  }

  function updateLaw(lawId: string, next: Partial<Law>) {
    patch({
      laws: current.laws.map((law) => (law.id === lawId ? { ...law, ...next } : law)),
    })
  }

  return (
    <div>
      <div className="back-row">
        <Link className="btn" to="..">
          ← Laws
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
          <Field label="Region">
            <input
              value={system.region}
              placeholder="Where this code holds"
              onChange={(event) => patch({ region: event.target.value })}
            />
          </Field>
          <Field label="Principles">
            <textarea
              value={system.principles}
              placeholder="Justice is a river; blood-price; the king's word…"
              onChange={(event) => patch({ principles: event.target.value })}
            />
          </Field>
          <Field label="Notes">
            <textarea value={system.notes} onChange={(event) => patch({ notes: event.target.value })} />
          </Field>
        </div>
      </div>

      <section style={{ marginTop: '1.4rem' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '0.8rem' }}>Statutes</h2>
        {system.laws.map((law) => (
          <div className="law-row paper" key={law.id} style={{ marginBottom: '0.7rem' }}>
            <input
              className="input"
              value={law.title}
              placeholder="Title"
              onChange={(event) => updateLaw(law.id, { title: event.target.value })}
            />
            <button
              type="button"
              className="btn btn-small"
              onClick={() => patch({ laws: system.laws.filter((entry) => entry.id !== law.id) })}
            >
              Remove
            </button>
            <textarea
              className="textarea"
              style={{ gridColumn: '1 / -1', minHeight: '5rem' }}
              value={law.text}
              placeholder="The letter of the law"
              onChange={(event) => updateLaw(law.id, { text: event.target.value })}
            />
          </div>
        ))}
        <button
          type="button"
          className="btn"
          onClick={() => patch({ laws: [...system.laws, { id: createId(), title: '', text: '' }] })}
        >
          Add a law
        </button>
      </section>

      {pendingDelete ? (
        <ConfirmDialog
          title="Strike this code?"
          body="The region will lose its written laws in this volume."
          onCancel={() => setPendingDelete(false)}
          onConfirm={() => {
            setLegalSystems(story.legalSystems.filter((entry) => entry.id !== id))
            navigate('..')
          }}
        />
      ) : null}
    </div>
  )
}
