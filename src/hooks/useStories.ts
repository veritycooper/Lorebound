import { useEffect, useState } from 'react'
import { listStories } from '../db'
import type { Story } from '../types'

export function useStories(refreshKey = 0) {
  const [stories, setStories] = useState<Story[] | null>(null)

  useEffect(() => {
    let cancelled = false
    void listStories().then((rows) => {
      if (!cancelled) setStories(rows)
    })
    return () => {
      cancelled = true
    }
  }, [refreshKey])

  return stories
}
