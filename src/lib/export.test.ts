import { beforeEach, describe, expect, it } from 'vitest'
import { db, exportLibrary, importLibrary, saveImage, saveStory } from '../db'
import { emptyCharacter, emptyPlace, emptyRelationship, emptyStory } from './entities'
import { dataUrlToArrayBuffer, decodeText } from './images'

describe('export / import', () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
  })

  it('round-trips stories and images', async () => {
    const imageId = await saveImage(new Blob(['portrait'], { type: 'text/plain' }), 'note.txt')
    const story = emptyStory({
      title: 'Ashwood',
      characters: [emptyCharacter({ name: 'Lira', imageId })],
      places: [emptyPlace({ name: 'The Mill', mapImageId: imageId })],
    })
    await saveStory(story)

    const payload = await exportLibrary()
    expect(payload.stories).toHaveLength(1)
    expect(payload.images).toHaveLength(1)
    expect(payload.images[0]?.dataUrl.startsWith('data:')).toBe(true)

    await importLibrary(payload, 'replace')
    const stories = await db.stories.toArray()
    expect(stories[0]?.title).toBe('Ashwood')
    expect(stories[0]?.characters[0]?.name).toBe('Lira')

    const images = await db.images.toArray()
    expect(images).toHaveLength(1)
    expect(decodeText(images[0]!.data)).toBe('portrait')
  })

  it('round-trips structured character relationships', async () => {
    const mill = emptyPlace({ id: 'mill', name: 'Ashwood Mill' })
    const lira = emptyCharacter({
      name: 'Lira',
      relationships: [
        emptyRelationship({ targetKind: 'place', targetId: mill.id, kind: 'lives in', notes: 'loft' }),
      ],
    })
    await saveStory(emptyStory({ title: 'Linked', characters: [lira], places: [mill] }))

    const payload = await exportLibrary()
    await importLibrary(payload, 'replace')
    const stories = await db.stories.toArray()
    const rel = stories[0]?.characters[0]?.relationships[0]
    expect(rel).toMatchObject({
      targetKind: 'place',
      targetId: 'mill',
      kind: 'lives in',
      notes: 'loft',
    })
    expect(rel).not.toHaveProperty('otherCharacterId')
  })

  it('hydrates legacy otherCharacterId rows on import', async () => {
    await importLibrary(
      {
        version: 1,
        app: 'lorebound',
        exportedAt: new Date().toISOString(),
        stories: [
          emptyStory({
            title: 'Old',
            characters: [
              emptyCharacter({
                id: 'lira',
                name: 'Lira',
                relationships: [{ id: 'r1', otherCharacterId: 'corvin', kind: 'rivals', notes: '' } as never],
              }),
              emptyCharacter({ id: 'corvin', name: 'Corvin' }),
            ],
          }),
        ],
        images: [],
      },
      'replace',
    )
    const stories = await db.stories.toArray()
    expect(stories[0]?.characters[0]?.relationships[0]).toMatchObject({
      targetKind: 'character',
      targetId: 'corvin',
      kind: 'rivals',
    })
  })

  it('merges without overwriting existing stories', async () => {
    await saveStory(emptyStory({ title: 'Kept' }))
    const incoming = emptyStory({ title: 'Imported' })
    await importLibrary(
      {
        version: 1,
        app: 'lorebound',
        exportedAt: new Date().toISOString(),
        stories: [incoming],
        images: [],
      },
      'merge',
    )
    const titles = (await db.stories.toArray()).map((story) => story.title).sort()
    expect(titles).toEqual(['Imported', 'Kept'])
  })

  it('rejects foreign files', async () => {
    await expect(
      importLibrary(
        {
          version: 1,
          app: 'other',
          exportedAt: '',
          stories: [],
          images: [],
        },
        'replace',
      ),
    ).rejects.toThrow(/not a Lorebound backup/)
  })
})

describe('dataUrlToArrayBuffer', () => {
  it('restores a small payload', () => {
    const parsed = dataUrlToArrayBuffer('data:text/plain;base64,aGk=')
    expect(decodeText(parsed.data)).toBe('hi')
    expect(parsed.mimeType).toBe('text/plain')
  })
})
