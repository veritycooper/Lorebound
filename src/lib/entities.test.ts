import { describe, expect, it } from 'vitest'
import {
  DEFAULT_SPECIES,
  displayName,
  dropMagicLinksTo,
  dropRelationshipsTo,
  emptyCharacter,
  emptyRelationship,
  emptyStory,
  formatHeight,
  hydrateCharacter,
  hydrateStory,
  linkCharacterToMagic,
  parseHeight,
  parseRelationshipTarget,
  parseTags,
  practitionersForSystem,
  relationshipTargetValue,
  setHeightPart,
  storySpeciesOptions,
  unlinkCharacterFromMagic,
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
    expect(story.characters[0]?.species).toBe('')
    expect(story.characters[0]?.height).toBeNull()
    expect(story.characters[0]?.magicLinks).toEqual([])
  })

  it('migrates magicSystemIds and practitionerIds onto one character link list', () => {
    const story = hydrateStory({
      id: 's1',
      characters: [
        { id: 'lira', name: 'Lira', magicSystemIds: ['hearth'] },
        { id: 'corvin', name: 'Corvin' },
      ],
      magicSystems: [{ id: 'hearth', name: 'Hearth-binding', practitionerIds: ['corvin', 'lira'] }],
    })
    expect(story.magicSystems[0]).not.toHaveProperty('practitionerIds')
    expect(story.characters[0]?.magicLinks).toEqual([{ magicSystemId: 'hearth', note: '' }])
    expect(story.characters[1]?.magicLinks).toEqual([{ magicSystemId: 'hearth', note: '' }])
  })

  it('keeps notes from character.magicLinks when both legacy shapes exist', () => {
    const story = hydrateStory({
      characters: [
        {
          id: 'lira',
          magicLinks: [{ magicSystemId: 'hearth', note: 'keeps the ovens lit' }],
          magicSystemIds: ['hearth'],
        },
      ],
      magicSystems: [{ id: 'hearth', name: 'Hearth-binding', practitionerIds: ['lira'] }],
    })
    expect(story.characters[0]?.magicLinks).toEqual([
      { magicSystemId: 'hearth', note: 'keeps the ovens lit' },
    ])
  })
})

describe('height', () => {
  it('serializes structured feet and inches', () => {
    expect(parseHeight({ feet: 5, inches: 7 })).toEqual({ feet: 5, inches: 7 })
    expect(formatHeight({ feet: 5, inches: 7 })).toBe('5′7″')
    expect(formatHeight(null)).toBe('')
  })

  it('builds a height from easy pickers', () => {
    const afterFeet = setHeightPart(null, 'feet', '5')
    expect(afterFeet).toEqual({ feet: 5, inches: 0 })
    expect(setHeightPart(afterFeet, 'inches', '7')).toEqual({ feet: 5, inches: 7 })
    expect(setHeightPart({ feet: 5, inches: 7 }, 'feet', '')).toEqual({ feet: 0, inches: 7 })
    expect(setHeightPart(null, 'inches', '')).toBeNull()
  })
})

describe('species options', () => {
  it('seeds defaults and reuses a custom species from the story', () => {
    const options = storySpeciesOptions([
      emptyCharacter({ species: 'Ashfolk' }),
      emptyCharacter({ species: 'elf' }),
    ])
    expect(options[0]).toBe('Human')
    expect(options).toContain('Ashfolk')
    expect(options.filter((name) => name.toLowerCase() === 'elf')).toEqual(['Elf'])
    expect(options).toEqual([...new Set(options)])
    for (const seed of DEFAULT_SPECIES) {
      expect(options).toContain(seed)
    }
  })
})

describe('magic link sync', () => {
  it('links and unlinks from either side against one source of truth', () => {
    let characters = [
      emptyCharacter({ id: 'lira', name: 'Lira' }),
      emptyCharacter({ id: 'corvin', name: 'Corvin' }),
    ]
    characters = linkCharacterToMagic(characters, 'lira', 'hearth', 'oven-warm')
    expect(practitionersForSystem(characters, 'hearth')).toEqual([
      { character: characters[0], note: 'oven-warm' },
    ])

    characters = linkCharacterToMagic(characters, 'corvin', 'hearth')
    expect(practitionersForSystem(characters, 'hearth').map((entry) => entry.character.id)).toEqual([
      'lira',
      'corvin',
    ])

    characters = unlinkCharacterFromMagic(characters, 'lira', 'hearth')
    expect(characters[0]?.magicLinks).toEqual([])
    expect(practitionersForSystem(characters, 'hearth')).toHaveLength(1)

    characters = dropMagicLinksTo(characters, 'hearth')
    expect(characters.every((character) => character.magicLinks.length === 0)).toBe(true)
  })
})
