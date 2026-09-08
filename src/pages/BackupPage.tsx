import { useRef, useState } from 'react'
import { useStory } from '../context/StoryContext'
import {
  downloadJson,
  exportLibrary,
  importLibrary,
  readExportFile,
} from '../db'
import { formatExactTime } from '../lib/dates'

export default function BackupPage() {
  const { story, persistNow, lastSavedAt } = useStory()
  const fileRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function exportStory() {
    await persistNow()
    const payload = await exportLibrary([story.id])
    downloadJson(`${slug(story.title)}-lorebound.json`, payload)
    setMessage('Downloaded this story, including any uploaded images.')
    setError(null)
  }

  async function exportAll() {
    await persistNow()
    const payload = await exportLibrary()
    downloadJson('lorebound-library.json', payload)
    setMessage('Downloaded the entire library from this browser.')
    setError(null)
  }

  async function onImport(mode: 'replace' | 'merge', file: File) {
    try {
      const payload = await readExportFile(file)
      const result = await importLibrary(payload, mode)
      setError(null)
      setMessage(
        mode === 'replace'
          ? `Replaced the library with ${result.stories} ${result.stories === 1 ? 'story' : 'stories'}. Reload if a page looks stale.`
          : `Merged ${result.stories} ${result.stories === 1 ? 'story' : 'stories'} into this browser.`,
      )
      if (mode === 'replace') {
        window.location.assign(import.meta.env.BASE_URL)
      }
    } catch (err) {
      setMessage(null)
      setError(err instanceof Error ? err.message : 'Could not import that file.')
    }
  }

  return (
    <div>
      <header className="page-head">
        <div>
          <p className="eyebrow">Keep the work</p>
          <h1>Backup</h1>
        </div>
      </header>
      <div className="section-gap">
        <div className="paper">
          <p>
            Lorebound saves automatically into this browser’s IndexedDB. Clearing site data, another
            device, or a private window will not see these volumes — export a JSON backup when the
            work matters.
          </p>
          <p className="muted" style={{ marginTop: '0.7rem' }}>
            Last saved {lastSavedAt ? formatExactTime(lastSavedAt) : '—'}
          </p>
        </div>
        <div className="row">
          <button type="button" className="btn btn-primary" onClick={() => void exportStory()}>
            Export this story
          </button>
          <button type="button" className="btn" onClick={() => void exportAll()}>
            Export entire library
          </button>
          <button type="button" className="btn" onClick={() => fileRef.current?.click()}>
            Import JSON
          </button>
          <input
            ref={fileRef}
            className="visually-hidden"
            type="file"
            accept="application/json,.json"
            onChange={(event) => {
              const file = event.target.files?.[0]
              event.target.value = ''
              if (!file) return
              const replace = window.confirm(
                'Replace the whole library with this file? Cancel to merge it alongside what you already have.',
              )
              void onImport(replace ? 'replace' : 'merge', file)
            }}
          />
        </div>
        {message ? <p className="hint">{message}</p> : null}
        {error ? <p className="danger-text">{error}</p> : null}
        <p className="hint">
          Images are stored as files in the browser and packed into the JSON export as data URLs.
          Pinterest links on characters are references only — save the picture yourself, then upload
          it.
        </p>
      </div>
    </div>
  )
}

function slug(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'story'
  )
}
