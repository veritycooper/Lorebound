import { useImageUrl } from '../hooks/useImageUrl'

type Props = {
  imageId: string | null
  label?: string
  variant?: 'portrait' | 'map'
  onUpload: (file: File) => void
  onClear: () => void
}

export function ImageUpload({ imageId, label = 'Image', variant = 'portrait', onUpload, onClear }: Props) {
  const url = useImageUrl(imageId)
  const className = variant === 'map' ? 'map-preview' : 'portrait'
  const placeholderClass = variant === 'map' ? 'map-placeholder' : 'portrait-placeholder'

  return (
    <div className="stack">
      {url ? (
        <img className={className} src={url} alt={label} />
      ) : (
        <div className={placeholderClass}>{variant === 'map' ? 'No map yet' : 'No portrait yet'}</div>
      )}
      <div className="row">
        <label className="btn file-btn">
          Upload
          <input
            type="file"
            accept="image/*"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) onUpload(file)
              event.target.value = ''
            }}
          />
        </label>
        {imageId ? (
          <button type="button" className="btn" onClick={onClear}>
            Remove
          </button>
        ) : null}
      </div>
      <p className="hint">
        Save images from Pinterest (or anywhere) to your device, then upload them here. Lorebound keeps the
        file in this browser — it never fetches Pinterest for you.
      </p>
    </div>
  )
}
