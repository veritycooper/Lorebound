import { Link } from 'react-router-dom'
import { Field } from '../components/Field'
import { LastSaved } from '../components/LastSaved'
import { useStory } from '../context/StoryContext'
import { formatRelativeTime } from '../lib/dates'
import { STORY_STATUSES } from '../types'
import { formatWordCount, wordCount } from '../lib/wordCount'

export default function OverviewPage() {
  const { story, updateStory, saveStatus, lastSavedAt } = useStory()
  const words = story.chapters.reduce((sum, chapter) => sum + wordCount(chapter.body), 0)
  const latestChapter = [...story.chapters].sort((a, b) => b.updatedAt - a.updatedAt)[0]

  return (
    <div>
      <header className="page-head">
        <div>
          <p className="eyebrow">The binding</p>
          <h1>Overview</h1>
        </div>
        <LastSaved status={saveStatus} lastSavedAt={lastSavedAt} />
      </header>

      <div className="section-gap">
        <div className="paper">
          <div className="stack">
            <Field label="Title">
              <input value={story.title} onChange={(event) => updateStory({ title: event.target.value })} />
            </Field>
            <Field label="Summary">
              <textarea
                value={story.summary}
                onChange={(event) => updateStory({ summary: event.target.value })}
                placeholder="Tone, promise, the trouble at the heart of it…"
              />
            </Field>
            <Field label="Status">
              <select
                value={story.status}
                onChange={(event) => updateStory({ status: event.target.value as typeof story.status })}
              >
                {STORY_STATUSES.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </div>

        <div className="stats">
          <div className="stat">
            <b>{story.characters.length}</b>
            <span>Characters</span>
          </div>
          <div className="stat">
            <b>{story.places.length}</b>
            <span>Places</span>
          </div>
          <div className="stat">
            <b>{formatWordCount(words)}</b>
            <span>Drafted</span>
          </div>
          <div className="stat">
            <b>{story.sceneIdeas.length}</b>
            <span>Scene scraps</span>
          </div>
        </div>

        <div className="row">
          {latestChapter ? (
            <Link className="btn btn-primary" to={`writing/${latestChapter.id}`}>
              Continue “{latestChapter.title}”
            </Link>
          ) : (
            <Link className="btn btn-primary" to="writing">
              Open the writing desk
            </Link>
          )}
          <Link className="btn" to="ideas">
            Catch a scene idea
          </Link>
        </div>
        <p className="hint">Touched {formatRelativeTime(story.updatedAt)}. Autosave keeps the volume as you write.</p>
      </div>
    </div>
  )
}
