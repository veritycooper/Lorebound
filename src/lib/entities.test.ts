import { describe, expect, it } from 'vitest'
import {
  displayName,
  dropRelationshipsTo,
  emptyRelationship,
  emptyStory,
  hydrateCharacter,
  hydrateStory,
  parseRelationshipTarget,
  parseTags,
  relationshipTargetValue,
} from './entities'

describe('parseTags', () => {
  it('splits commas and hashes', () => {
    expect(parseTags('rain, betrayal #market')).toEqual(['rain', 'betrayal', 'market'])
  })

  it('drops empties', () => {
    expect(parseTags(' , # ')).toEqual([])
  })
})

describe('displayName', () => {
  it('falls back when blank', () => {
    expect(displayName('', 'Unnamed character')).toBe('Unnamed character')
    expect(displayName('  Lira  ', 'Unnamed character')).toBe('Lira')
  })
})

describe('emptyStory', () => {
  it('starts with nested collections', () => {
    const story = emptyStory({ title: 'Ashwood' })
    expect(story.title).toBe('Ashwood')
    expect(story.characters).toEqual([])
    expect(story.status).toBe('seed')
  })
})

describe('relationship helpers', () => {
  it('encodes and parses a target picker value', () => {
    const rel = emptyRelationship({ targetKind: 'place', targetId: 'mill' })
    expect(relationshipTargetValue(rel)).toBe('place:mill')
    expect(parseRelationshipTarget('character:lira')).toEqual({
      targetKind: 'character',
      targetId: 'lira',
    })
  })

  it('hydrates a character that still uses otherCharacterId', () => {
    const character = hydrateCharacter({
      id: 'lira',
      name: 'Lira',
      relationships: [{ id: 'r1', otherCharacterId: 'corvin', kind: 'rivals', notes: '' }],
    })
    expect(character.relationships[0]).toMatchObject({
      targetKind: 'character',
      targetId: 'corvin',
      kind: 'rivals',
    })
  })

  it('drops incoming links when a target is removed', () => {
    const kept = dropRelationshipsTo(
      [
        hydrateCharacter({
          id: 'lira',
          relationships: [
            emptyRelationship({ targetKind: 'character', targetId: 'corvin', kind: 'rivals' }),
            emptyRelationship({ targetKind: 'place', targetId: 'mill', kind: 'lives in' }),
          ],
        }),
      ],
      'character',
      'corvin',
    )
    expect(kept[0]?.relationships).toHaveLength(1)
    expect(kept[0]?.relationships[0]?.targetId).toBe('mill')
  })
})

describe('hydrateStory', () => {
  it('fills missing collections and migrates relationships', () => {
    const story = hydrateStory({
      id: 's1',
      title: 'Ashwood',
      characters: [
        {
          id: 'lira',
          name: 'Lira',
          relationships: [{ id: 'r1', otherCharacterId: 'x', kind: 'owes', notes: '' }],
        },
      ],
    })
    expect(story.places).toEqual([])
    expect(story.characters[0]?.relationships[0]?.targetKind).toBe('character')
  })
})
