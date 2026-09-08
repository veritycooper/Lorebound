import { useNavigate } from 'react-router-dom'
import { EmptyState } from '../components/EmptyState'
import { useStory } from '../context/StoryContext'
import { formatRelativeTime } from '../lib/dates'
import { formatWordCount, wordCount } from '../lib/wordCount'
import { displayName } from '../lib/entities'

export default function WritingPage() {
  const { story, addChapter } = useStory()
  const navigate = useNavigate()
  const total = story.chapters.reduce((sum, chapter) => sum + wordCount(chapter.body), 0)

  return (
    <div>
      <header className="page-head">
        <div>
          <p className="eyebrow">The desk</p>
          <h1>Writing</h1>
          <p className="hint">{formatWordCount(total)} across this volume</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => navigate(addChapter().id)}>
          New chapter
        </button>
      </header>
      {story.chapters.length === 0 ? (
        <EmptyState
          title="A blank gathering of pages"
          body="Draft here when the world notes are close at hand. Word count lives in the margin; the manuscript autosaves as you go."
        />
      ) : (
        <div className="section-gap">
          {story.chapters.map((chapter) => (
            <button
              key={chapter.id}
              type="button"
              className="entity-card"
              style={{ textAlign: 'left', cursor: 'pointer', minHeight: 0 }}
              onClick={() => navigate(chapter.id)}
            >
              <h3>{displayName(chapter.title, 'Untitled chapter')}</h3>
              <p className="muted small">
                {formatWordCount(wordCount(chapter.body))} · {formatRelativeTime(chapter.updatedAt)}
              </p>
              <p className="muted small" style={{ marginTop: '0.45rem' }}>
                {chapter.body.trim() ? chapter.body.trim().slice(0, 180) : 'Empty page.'}
                {chapter.body.trim().length > 180 ? '…' : ''}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
