import { useEffect, useState } from 'react'
import { getImage } from '../db'

export function useImageUrl(imageId: string | null | undefined) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!imageId) {
      setUrl(null)
      return
    }
    let objectUrl: string | null = null
    let cancelled = false
    void getImage(imageId).then((record) => {
      if (cancelled || !record) return
      objectUrl = URL.createObjectURL(new Blob([record.data], { type: record.mimeType }))
      setUrl(objectUrl)
    })
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [imageId])

  return url
}
