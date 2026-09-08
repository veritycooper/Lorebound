import { type FormEvent, useState } from 'react'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { EmptyState } from '../components/EmptyState'
import { Field } from '../components/Field'
import { useStory } from '../context/StoryContext'
import { formatRelativeTime } from '../lib/dates'
import { parseTags } from '../lib/entities'
import type { SceneIdea } from '../types'

export default function SceneIdeasPage() {
  const { story, addSceneIdea, setSceneIdeas } = useStory()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [tags, setTags] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)

  function onCapture(event: FormEvent) {
    event.preventDefault()
    if (!title.trim() && !body.trim()) return
    addSceneIdea({
      title: title.trim() || 'Untitled spark',
      body: body.trim(),
      tags: parseTags(tags),
    })
    setTitle('')
    setBody('')
    setTags('')
  }

  function patchIdea(id: string, next: Partial<SceneIdea>) {
    setSceneIdeas(story.sceneIdeas.map((idea) => (idea.id === id ? { ...idea, ...next } : idea)))
  }

  const deleting = story.sceneIdeas.find((idea) => idea.id === pendingDelete)

  return (
    <div>
      <header className="page-head">
        <div>
          <p className="eyebrow">Catch it before it leaves</p>
          <h1>Scene ideas</h1>
        </div>
      </header>

      <form className="idea-form" onSubmit={onCapture}>
        <div className="stack">
          <Field label="Title">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="A door that should not open"
            />
          </Field>
          <Field label="The scrap">
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="Write the image, the line of dialogue, the smell of the room…"
              style={{ minHeight: '6rem' }}
            />
          </Field>
          <Field label="Tags">
            <input
              value={tags}
              onChange={(event) => setTags(event.target.value)}
              placeholder="rain, betrayal, market — comma separated"
            />
          </Field>
          <button className="btn btn-primary" type="submit">
            Pin to the ledger
          </button>
        </div>
      </form>

      {story.sceneIdeas.length === 0 ? (
        <EmptyState
          title="The ledger is empty"
          body="This is the pocket notebook: titles, fragments, tags. Capture on a phone between trains; it will still be here when you sit down to draft."
        />
      ) : (
        <div className="idea-list">
          {story.sceneIdeas.map((idea) => {
            const open = editingId === idea.id
            return (
              <article key={idea.id} className="idea">
                <div className="card-foot" style={{ marginTop: 0 }}>
                  <div>
                    <h3>{idea.title || 'Untitled spark'}</h3>
                    <p className="muted small">{formatRelativeTime(idea.createdAt)}</p>
                  </div>
                  <div className="row">
                    <button type="button" className="btn btn-small" onClick={() => setEditingId(open ? null : idea.id)}>
                      {open ? 'Close' : 'Edit'}
                    </button>
                    <button type="button" className="btn btn-small" onClick={() => setPendingDelete(idea.id)}>
                      Delete
                    </button>
                  </div>
                </div>
                {!open ? (
                  <>
                    <p className="muted" style={{ marginTop: '0.6rem', fontFamily: 'var(--reading)' }}>
                      {idea.body || 'No body yet.'}
                    </p>
                    <div className="tags">
                      {idea.tags.map((tag) => (
                        <span className="chip" key={tag}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="stack" style={{ marginTop: '0.8rem' }}>
                    <input
                      className="input"
                      value={idea.title}
                      onChange={(event) => patchIdea(idea.id, { title: event.target.value })}
                    />
                    <textarea
                      className="textarea"
                      value={idea.body}
                      onChange={(event) => patchIdea(idea.id, { body: event.target.value })}
                    />
                    <input
                      className="input"
                      value={idea.tags.join(', ')}
                      onChange={(event) => patchIdea(idea.id, { tags: parseTags(event.target.value) })}
                    />
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}

      {deleting ? (
        <ConfirmDialog
          title="Drop this scrap?"
          body="The idea leaves the ledger. If it mattered, copy it into a chapter first."
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => {
            setSceneIdeas(story.sceneIdeas.filter((idea) => idea.id !== deleting.id))
            setPendingDelete(null)
          }}
        />
      ) : null}
    </div>
  )
}
