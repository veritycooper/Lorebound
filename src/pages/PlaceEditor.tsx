import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { Field } from '../components/Field'
import { ImageUpload } from '../components/ImageUpload'
import { useStory } from '../context/StoryContext'
import type { Place } from '../types'
import { PLACE_TYPES } from '../types'

export default function PlaceEditor() {
  const { entityId } = useParams()
  const navigate = useNavigate()
  const { story, setPlaces, saveImageFile, removeImage } = useStory()
  const place = story.places.find((entry) => entry.id === entityId)
  const [pendingDelete, setPendingDelete] = useState(false)

  if (!place) {
    return (
      <div className="empty">
        <h2>Place not found</h2>
        <Link className="btn" to="..">
          Back to places
        </Link>
      </div>
    )
  }

  const current = place
  const id = current.id

  function patch(next: Partial<Place>) {
    setPlaces(story.places.map((entry) => (entry.id === id ? { ...entry, ...next } : entry)))
  }

  async function onUpload(file: File) {
    const mapImageId = await saveImageFile(file)
    if (current.mapImageId) await removeImage(current.mapImageId)
    patch({ mapImageId })
  }

  async function onClearImage() {
    if (current.mapImageId) await removeImage(current.mapImageId)
    patch({ mapImageId: null })
  }

  function toggleConnected(otherId: string) {
    const has = current.connectedPlaceIds.includes(otherId)
    patch({
      connectedPlaceIds: has
        ? current.connectedPlaceIds.filter((entry) => entry !== otherId)
        : [...current.connectedPlaceIds, otherId],
    })
  }

  return (
    <div>
      <div className="back-row">
        <Link className="btn" to="..">
          ← Places
        </Link>
        <button type="button" className="btn btn-wine" onClick={() => setPendingDelete(true)}>
          Delete
        </button>
      </div>
      <header className="page-head">
        <h1>{place.name}</h1>
      </header>
      <div className="section-gap">
        <ImageUpload
          variant="map"
          imageId={place.mapImageId}
          label={`${place.name} map`}
          onUpload={(file) => void onUpload(file)}
          onClear={() => void onClearImage()}
        />
        <div className="paper">
          <div className="stack">
            <Field label="Name">
              <input value={place.name} onChange={(event) => patch({ name: event.target.value })} />
            </Field>
            <Field label="Type">
              <select
                value={place.type}
                onChange={(event) => patch({ type: event.target.value as Place['type'] })}
              >
                {PLACE_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Description">
              <textarea
                value={place.description}
                onChange={(event) => patch({ description: event.target.value })}
              />
            </Field>
            <Field label="Notes">
              <textarea value={place.notes} onChange={(event) => patch({ notes: event.target.value })} />
            </Field>
          </div>
        </div>
        <section>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '0.7rem' }}>Connected places</h2>
          {story.places.filter((entry) => entry.id !== id).length === 0 ? (
            <p className="hint">Add another place to link roads, borders, and gossip routes.</p>
          ) : (
            <div className="connect-grid">
              {story.places
                .filter((entry) => entry.id !== id)
                .map((entry) => (
                  <label key={entry.id}>
                    <input
                      type="checkbox"
                      checked={place.connectedPlaceIds.includes(entry.id)}
                      onChange={() => toggleConnected(entry.id)}
                    />
                    {entry.name}
                  </label>
                ))}
            </div>
          )}
        </section>
      </div>
      {pendingDelete ? (
        <ConfirmDialog
          title={`Unmap ${place.name}?`}
          body="The place and its map image will leave this volume."
          onCancel={() => setPendingDelete(false)}
          onConfirm={() => {
            if (place.mapImageId) void removeImage(place.mapImageId)
            setPlaces(
              story.places
                .filter((entry) => entry.id !== id)
                .map((entry) => ({
                  ...entry,
                  connectedPlaceIds: entry.connectedPlaceIds.filter((connected) => connected !== id),
                })),
            )
            navigate('..')
          }}
        />
      ) : null}
    </div>
  )
}
