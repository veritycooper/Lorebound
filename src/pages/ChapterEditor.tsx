import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { useStory } from '../context/StoryContext'
import { formatWordCount, wordCount } from '../lib/wordCount'
import type { Chapter } from '../types'

export default function ChapterEditor() {
  const { entityId } = useParams()
  const navigate = useNavigate()
  const { story, setChapters } = useStory()
  const chapter = story.chapters.find((entry) => entry.id === entityId)
  const [pendingDelete, setPendingDelete] = useState(false)

  if (!chapter) {
    return (
      <div className="empty">
        <h2>Chapter not found</h2>
        <Link className="btn" to="..">
          Back to writing
        </Link>
      </div>
    )
  }

  const id = chapter.id

  function patch(next: Partial<Chapter>) {
    setChapters(
      story.chapters.map((entry) =>
        entry.id === id ? { ...entry, ...next, updatedAt: Date.now() } : entry,
      ),
    )
  }

  return (
    <div>
      <div className="back-row">
        <Link className="btn" to="..">
          ← Writing
        </Link>
        <button type="button" className="btn btn-wine" onClick={() => setPendingDelete(true)}>
          Delete
        </button>
      </div>
      <div className="paper editor-canvas">
        <input
          className="input"
          value={chapter.title}
          onChange={(event) => patch({ title: event.target.value })}
          style={{
            background: 'transparent',
            border: 'none',
            fontFamily: 'var(--serif)',
            fontSize: '2.2rem',
            padding: '0 0 0.8rem',
            boxShadow: 'none',
          }}
        />
        <textarea
          className="manuscript"
          value={chapter.body}
          placeholder="Write as if the lamp will last the night…"
          onChange={(event) => patch({ body: event.target.value })}
        />
        <div className="word-count">{formatWordCount(wordCount(chapter.body))}</div>
      </div>
      {pendingDelete ? (
        <ConfirmDialog
          title="Tear out this chapter?"
          body="The draft leaves this volume. Export first if you need a copy."
          onCancel={() => setPendingDelete(false)}
          onConfirm={() => {
            setChapters(story.chapters.filter((entry) => entry.id !== id))
            navigate('..')
          }}
        />
      ) : null}
    </div>
  )
}
