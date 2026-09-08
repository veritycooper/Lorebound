import { formatRelativeTime } from '../lib/dates'
import type { SaveStatus } from '../context/StoryContext'

export function LastSaved({
  status,
  lastSavedAt,
}: {
  status: SaveStatus
  lastSavedAt: number | null
}) {
  const label =
    status === 'saving'
      ? 'Saving…'
      : status === 'error'
        ? 'Could not save'
        : lastSavedAt
          ? `Saved ${formatRelativeTime(lastSavedAt)}`
          : 'Not saved yet'

  return <div className={`save-indicator ${status}`}>{label}</div>
}
