import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { EmptyState } from '../components/EmptyState'
import { Field } from '../components/Field'
import { createStory, deleteStory } from '../db'
import { useStories } from '../hooks/useStories'
import { formatRelativeTime } from '../lib/dates'
import { STATUS_LABELS } from '../lib/entities'
import { wordCount } from '../lib/wordCount'

export default function HomePage() {
  const [refreshKey, setRefreshKey] = useState(0)
  const stories = useStories(refreshKey)
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)
  const navigate = useNavigate()

  async function onCreate(event: FormEvent) {
    event.preventDefault()
    const story = await createStory(title, summary)
    setTitle('')
    setSummary('')
    navigate(`/story/${story.id}`)
  }

  const deleting = stories?.find((story) => story.id === pendingDelete)

  return (
    <div className="home">
      <header className="home-hero">
        <div>
          <div className="eyebrow">Private story bible</div>
          <h1>Lorebound</h1>
          <p className="lede">
            A quiet desk for characters, places, laws, magic, and drafts. Everything stays in this
            browser until you export it — no account, no server, no vanished notes after refresh.
          </p>
        </div>
        <form className="home-compose" onSubmit={onCreate}>
          <h2>Open a new volume</h2>
          <div className="stack">
            <Field label="Working title">
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="The Salt Road, Ashwood, Night Ledger…"
                required
              />
            </Field>
            <Field label="A sentence of weather">
              <textarea
                value={summary}
                onChange={(event) => setSummary(event.target.value)}
                placeholder="What is this world about, in one breath?"
                style={{ minHeight: '5rem' }}
              />
            </Field>
            <button className="btn btn-primary" type="submit">
              Begin the story
            </button>
          </div>
        </form>
      </header>

      {!stories ? (
        <p className="muted">Dusting the shelves…</p>
      ) : stories.length === 0 ? (
        <EmptyState
          title="The library is waiting"
          body="Start with a title. You can add characters, maps, and midnight scene ideas the moment the first page exists."
        />
      ) : (
        <div className="story-grid">
          {stories.map((story) => {
            const words = story.chapters.reduce((sum, chapter) => sum + wordCount(chapter.body), 0)
            return (
              <article key={story.id} className="story-card">
                <Link to={`/story/${story.id}`}>
                  <span className="status-pill">{STATUS_LABELS[story.status]}</span>
                  <h3>{story.title}</h3>
                  <p className="muted small">{story.summary || 'No summary yet — the door is still ajar.'}</p>
                </Link>
                <div className="card-foot">
                  <span className="muted small">
                    {story.characters.length} people · {words.toLocaleString()} words ·{' '}
                    {formatRelativeTime(story.updatedAt)}
                  </span>
                  <button
                    type="button"
                    className="btn btn-small"
                    onClick={() => setPendingDelete(story.id)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {deleting ? (
        <ConfirmDialog
          title={`Burn the volume “${deleting.title}”?`}
          body="This removes the story and its images from this browser. Export first if you might want it back."
          confirmLabel="Delete story"
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => {
            void deleteStory(deleting.id).then(() => {
              setPendingDelete(null)
              setRefreshKey((key) => key + 1)
            })
          }}
        />
      ) : null}
    </div>
  )
}
