import Dexie, { type Table } from 'dexie'
import type { ImageRecord, LoreboundExport, Story } from './types'
import { emptyStory } from './lib/entities'
import { arrayBufferToDataUrl, blobToArrayBuffer, dataUrlToArrayBuffer } from './lib/images'
import { createId } from './lib/ids'

type MetaRow = { key: string; value: number }

class LoreboundDB extends Dexie {
  stories!: Table<Story, string>
  images!: Table<ImageRecord, string>
  meta!: Table<MetaRow, string>

  constructor() {
    super('lorebound')
    this.version(1).stores({
      stories: 'id, updatedAt, title',
      images: 'id',
      meta: 'key',
    })
  }
}

export const db = new LoreboundDB()

export async function listStories(): Promise<Story[]> {
  const stories = await db.stories.orderBy('updatedAt').reverse().toArray()
  return stories
}

export async function getStory(id: string): Promise<Story | undefined> {
  return db.stories.get(id)
}

export async function saveStory(story: Story): Promise<void> {
  await db.stories.put(story)
  await db.meta.put({ key: 'lastSavedAt', value: Date.now() })
}

export async function deleteStory(id: string): Promise<void> {
  const story = await db.stories.get(id)
  if (story) {
    const imageIds = collectImageIds(story)
    await db.transaction('rw', db.stories, db.images, db.meta, async () => {
      if (imageIds.length) {
        await db.images.bulkDelete(imageIds)
      }
      await db.stories.delete(id)
      await db.meta.put({ key: 'lastSavedAt', value: Date.now() })
    })
  }
}

export async function createStory(title: string, summary = ''): Promise<Story> {
  const story = emptyStory({
    title: title.trim() || 'Untitled story',
    summary: summary.trim(),
  })
  await saveStory(story)
  return story
}

export async function getLastSavedAt(): Promise<number | null> {
  const row = await db.meta.get('lastSavedAt')
  return row?.value ?? null
}

export async function saveImage(file: File | Blob, name = 'image'): Promise<string> {
  const id = createId()
  const mimeType = file.type || 'application/octet-stream'
  const fileName = file instanceof File ? file.name : name
  await db.images.put({
    id,
    data: await blobToArrayBuffer(file),
    mimeType,
    name: fileName,
    createdAt: Date.now(),
  })
  return id
}

export async function getImage(id: string): Promise<ImageRecord | undefined> {
  return db.images.get(id)
}

export async function deleteImage(id: string): Promise<void> {
  await db.images.delete(id)
}

export function collectImageIds(story: Story): string[] {
  const ids = new Set<string>()
  for (const character of story.characters) {
    if (character.imageId) ids.add(character.imageId)
  }
  for (const place of story.places) {
    if (place.mapImageId) ids.add(place.mapImageId)
  }
  return [...ids]
}

export async function exportLibrary(storyIds?: string[]): Promise<LoreboundExport> {
  const stories = storyIds
    ? ((await db.stories.bulkGet(storyIds)).filter(Boolean) as Story[])
    : await db.stories.toArray()

  const imageIdSet = new Set<string>()
  for (const story of stories) {
    for (const id of collectImageIds(story)) imageIdSet.add(id)
  }

  const images = []
  for (const id of imageIdSet) {
    const record = await db.images.get(id)
    if (!record) continue
    images.push({
      id: record.id,
      mimeType: record.mimeType,
      name: record.name,
      dataUrl: arrayBufferToDataUrl(record.data, record.mimeType),
    })
  }

  return {
    version: 1,
    app: 'lorebound',
    exportedAt: new Date().toISOString(),
    stories,
    images,
  }
}

export function downloadJson(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export async function importLibrary(
  payload: unknown,
  mode: 'replace' | 'merge',
): Promise<{ stories: number; images: number }> {
  if (!isLoreboundExport(payload)) {
    throw new Error('This file is not a Lorebound backup.')
  }

  const stories = payload.stories
  const images = payload.images ?? []

  await db.transaction('rw', db.stories, db.images, db.meta, async () => {
    if (mode === 'replace') {
      await db.stories.clear()
      await db.images.clear()
    }

    const imageIdMap = new Map<string, string>()
    for (const image of images) {
      const newId = mode === 'merge' ? createId() : image.id
      imageIdMap.set(image.id, newId)
      const parsed = dataUrlToArrayBuffer(image.dataUrl)
      await db.images.put({
        id: newId,
        data: parsed.data,
        mimeType: image.mimeType || parsed.mimeType,
        name: image.name,
        createdAt: Date.now(),
      })
    }

    for (const story of stories) {
      const remapped = remapStoryImages(story, imageIdMap)
      const nextStory =
        mode === 'merge'
          ? { ...remapped, id: createId(), updatedAt: Date.now() }
          : remapped
      await db.stories.put(nextStory)
    }

    await db.meta.put({ key: 'lastSavedAt', value: Date.now() })
  })

  return { stories: stories.length, images: images.length }
}

function remapStoryImages(story: Story, imageIdMap: Map<string, string>): Story {
  return {
    ...story,
    characters: story.characters.map((character) => ({
      ...character,
      imageId: character.imageId ? (imageIdMap.get(character.imageId) ?? character.imageId) : null,
    })),
    places: story.places.map((place) => ({
      ...place,
      mapImageId: place.mapImageId ? (imageIdMap.get(place.mapImageId) ?? place.mapImageId) : null,
    })),
  }
}

export async function readExportFile(file: File): Promise<LoreboundExport> {
  const text = await file.text()
  const parsed: unknown = JSON.parse(text)
  if (!isLoreboundExport(parsed)) {
    throw new Error('This file is not a Lorebound backup.')
  }
  return parsed
}

function isLoreboundExport(payload: unknown): payload is LoreboundExport {
  if (!payload || typeof payload !== 'object') return false
  const record = payload as Record<string, unknown>
  return record.app === 'lorebound' && record.version === 1 && Array.isArray(record.stories)
}
