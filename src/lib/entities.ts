import type {
  Chapter,
  Character,
  CharacterHeight,
  CharacterMagicLink,
  LegalSystem,
  MagicSystem,
  Place,
  RelationTargetKind,
  Relationship,
  SceneIdea,
  Story,
  StoryStatus,
} from '../types'
import { createId } from './ids'

export const HEIGHT_FEET_MAX = 12
export const HEIGHT_INCHES_MAX = 11

export const DEFAULT_SPECIES = [
  'Human',
  'Elf',
  'Dwarf',
  'Halfling',
  'Orc',
  'Goblin',
  'Gnome',
  'Fae',
  'Giant',
  'Dragonborn',
] as const

export function emptyStory(partial?: Partial<Story>): Story {
  const now = Date.now()
  return {
    id: createId(),
    title: 'Untitled story',
    summary: '',
    status: 'seed',
    createdAt: now,
    updatedAt: now,
    characters: [],
    magicSystems: [],
    legalSystems: [],
    places: [],
    chapters: [],
    sceneIdeas: [],
    ...partial,
  }
}

export function emptyRelationship(partial?: Partial<Relationship>): Relationship {
  return {
    id: createId(),
    targetKind: 'character',
    targetId: '',
    kind: '',
    notes: '',
    ...partial,
  }
}

export function emptyCharacter(partial?: Partial<Character>): Character {
  return {
    id: createId(),
    name: '',
    role: '',
    aliases: '',
    species: '',
    height: null,
    appearance: '',
    personality: '',
    notes: '',
    imageId: null,
    pinterestUrl: '',
    relationships: [],
    magicLinks: [],
    ...partial,
  }
}

export function emptyMagicSystem(partial?: Partial<MagicSystem>): MagicSystem {
  return {
    id: createId(),
    name: '',
    rules: '',
    costs: '',
    whoCanUse: '',
    notes: '',
    ...partial,
  }
}

export function emptyLegalSystem(partial?: Partial<LegalSystem>): LegalSystem {
  return {
    id: createId(),
    name: '',
    region: '',
    principles: '',
    laws: [],
    notes: '',
    ...partial,
  }
}

export function emptyPlace(partial?: Partial<Place>): Place {
  return {
    id: createId(),
    name: '',
    type: 'other',
    description: '',
    connectedPlaceIds: [],
    mapImageId: null,
    notes: '',
    ...partial,
  }
}

export function emptyChapter(partial?: Partial<Chapter>): Chapter {
  const now = Date.now()
  return {
    id: createId(),
    title: '',
    body: '',
    updatedAt: now,
    ...partial,
  }
}

export function emptySceneIdea(partial?: Partial<SceneIdea>): SceneIdea {
  return {
    id: createId(),
    title: '',
    body: '',
    tags: [],
    createdAt: Date.now(),
    ...partial,
  }
}

export function touchStory(story: Story, extra?: Partial<Story>): Story {
  return {
    ...story,
    ...extra,
    updatedAt: Date.now(),
  }
}

export function displayName(value: string, fallback: string): string {
  const trimmed = value.trim()
  return trimmed || fallback
}

export function parseTags(value: string): string[] {
  return value
    .split(/[,#]/)
    .map((tag) => tag.trim())
    .filter(Boolean)
}

export const STATUS_LABELS: Record<StoryStatus, string> = {
  seed: 'Seed',
  drafting: 'Drafting',
  revising: 'Revising',
  complete: 'Complete',
}

type LegacyRelationship = Partial<Relationship> & {
  otherCharacterId?: string
}

export function hydrateRelationship(raw: unknown): Relationship {
  const record = raw && typeof raw === 'object' ? (raw as LegacyRelationship) : {}
  const kind = typeof record.kind === 'string' ? record.kind : ''
  const notes = typeof record.notes === 'string' ? record.notes : ''
  const id = typeof record.id === 'string' && record.id ? record.id : createId()

  if (record.targetKind === 'place' || record.targetKind === 'character') {
    return {
      id,
      targetKind: record.targetKind,
      targetId: typeof record.targetId === 'string' ? record.targetId : '',
      kind,
      notes,
    }
  }

  const legacyId = typeof record.otherCharacterId === 'string' ? record.otherCharacterId : ''
  const targetId = typeof record.targetId === 'string' && record.targetId ? record.targetId : legacyId
  return {
    id,
    targetKind: 'character',
    targetId,
    kind,
    notes,
  }
}

export function hydrateCharacter(raw: unknown): Character {
  const record = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const { relationships, height, species, magicLinks: _magicLinks, magicSystemIds: _ids, ...rest } = record
  const base = emptyCharacter(rest as Partial<Character>)
  return {
    ...base,
    species: typeof species === 'string' ? species : '',
    height: parseHeight(height),
    relationships: Array.isArray(relationships) ? relationships.map((entry) => hydrateRelationship(entry)) : [],
    magicLinks: hydrateMagicLinks(record),
  }
}

export function hydrateMagicSystem(raw: unknown): MagicSystem {
  const record = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const { practitionerIds: _legacy, ...rest } = record
  return emptyMagicSystem(rest as Partial<MagicSystem>)
}

export function hydratePlace(raw: unknown): Place {
  const record = raw && typeof raw === 'object' ? (raw as Partial<Place>) : {}
  const base = emptyPlace(record)
  return {
    ...base,
    connectedPlaceIds: Array.isArray(record.connectedPlaceIds)
      ? record.connectedPlaceIds.filter((id): id is string => typeof id === 'string')
      : [],
  }
}

export function hydrateStory(raw: unknown): Story {
  const record = raw && typeof raw === 'object' ? (raw as Partial<Story> & { magicSystems?: unknown[] }) : {}
  const base = emptyStory(record)
  const rawSystems = Array.isArray(record.magicSystems) ? record.magicSystems : []
  const magicSystems = rawSystems.map((entry) => hydrateMagicSystem(entry))
  const systemIds = new Set(magicSystems.map((system) => system.id))
  const characters = applyLegacyPractitionerIds(
    Array.isArray(record.characters) ? record.characters.map((entry) => hydrateCharacter(entry)) : [],
    rawSystems,
  ).map((character) => ({
    ...character,
    magicLinks: character.magicLinks.filter((link) => systemIds.has(link.magicSystemId)),
  }))
  return {
    ...base,
    characters,
    magicSystems,
    legalSystems: Array.isArray(record.legalSystems) ? record.legalSystems : [],
    places: Array.isArray(record.places) ? record.places.map((entry) => hydratePlace(entry)) : [],
    chapters: Array.isArray(record.chapters) ? record.chapters : [],
    sceneIdeas: Array.isArray(record.sceneIdeas) ? record.sceneIdeas : [],
  }
}

export function relationshipTargetValue(rel: Relationship): string {
  return rel.targetId ? `${rel.targetKind}:${rel.targetId}` : ''
}

export function parseRelationshipTarget(value: string): {
  targetKind: RelationTargetKind
  targetId: string
} {
  const separator = value.indexOf(':')
  if (separator <= 0) {
    return { targetKind: 'character', targetId: '' }
  }
  const kind = value.slice(0, separator)
  const targetId = value.slice(separator + 1)
  if (kind === 'place' || kind === 'character') {
    return { targetKind: kind, targetId }
  }
  return { targetKind: 'character', targetId: '' }
}

export function dropRelationshipsTo(characters: Character[], targetKind: RelationTargetKind, targetId: string) {
  return characters.map((character) => ({
    ...character,
    relationships: character.relationships.filter(
      (rel) => !(rel.targetKind === targetKind && rel.targetId === targetId),
    ),
  }))
}

function clampInt(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(value)))
}

export function parseHeight(raw: unknown): CharacterHeight | null {
  if (raw == null || raw === '') return null
  if (typeof raw === 'object') {
    const record = raw as { feet?: unknown; inches?: unknown }
    const hasFeet = typeof record.feet === 'number' && Number.isFinite(record.feet)
    const hasInches = typeof record.inches === 'number' && Number.isFinite(record.inches)
    if (!hasFeet && !hasInches) return null
    return {
      feet: hasFeet ? clampInt(record.feet as number, 0, HEIGHT_FEET_MAX) : 0,
      inches: hasInches ? clampInt(record.inches as number, 0, HEIGHT_INCHES_MAX) : 0,
    }
  }
  return null
}

export function formatHeight(height: CharacterHeight | null): string {
  if (!height) return ''
  return `${height.feet}′${height.inches}″`
}

export function setHeightPart(
  current: CharacterHeight | null,
  part: 'feet' | 'inches',
  raw: string,
): CharacterHeight | null {
  const parsed = raw === '' ? null : Number(raw)
  if (parsed !== null && !Number.isFinite(parsed)) return current
  const nextFeet = part === 'feet' ? parsed : (current?.feet ?? null)
  const nextInches = part === 'inches' ? parsed : (current?.inches ?? null)
  if (nextFeet === null && nextInches === null) return null
  return {
    feet: nextFeet === null ? 0 : clampInt(nextFeet, 0, HEIGHT_FEET_MAX),
    inches: nextInches === null ? 0 : clampInt(nextInches, 0, HEIGHT_INCHES_MAX),
  }
}

export function storySpeciesOptions(characters: Pick<Character, 'species'>[]): string[] {
  const seen = new Set<string>()
  const options: string[] = []
  for (const name of [...DEFAULT_SPECIES, ...characters.map((character) => character.species)]) {
    const trimmed = name.trim()
    if (!trimmed) continue
    const key = trimmed.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    options.push(trimmed)
  }
  return options
}

export function hydrateMagicLinks(record: Record<string, unknown>): CharacterMagicLink[] {
  const links = new Map<string, CharacterMagicLink>()
  const rawIds = record.magicSystemIds
  if (Array.isArray(rawIds)) {
    for (const id of rawIds) {
      if (typeof id === 'string' && id) {
        links.set(id, { magicSystemId: id, note: '' })
      }
    }
  }
  const rawLinks = record.magicLinks
  if (Array.isArray(rawLinks)) {
    for (const entry of rawLinks) {
      if (!entry || typeof entry !== 'object') continue
      const item = entry as { magicSystemId?: unknown; note?: unknown }
      const magicSystemId = typeof item.magicSystemId === 'string' ? item.magicSystemId : ''
      if (!magicSystemId) continue
      links.set(magicSystemId, {
        magicSystemId,
        note: typeof item.note === 'string' ? item.note : '',
      })
    }
  }
  return [...links.values()]
}

export function applyLegacyPractitionerIds(characters: Character[], rawSystems: unknown[]): Character[] {
  let next = characters
  for (const system of rawSystems) {
    if (!system || typeof system !== 'object') continue
    const record = system as { id?: unknown; practitionerIds?: unknown }
    const systemId = typeof record.id === 'string' ? record.id : ''
    if (!systemId || !Array.isArray(record.practitionerIds)) continue
    for (const characterId of record.practitionerIds) {
      if (typeof characterId === 'string' && characterId) {
        next = linkCharacterToMagic(next, characterId, systemId)
      }
    }
  }
  return next
}

export function linkCharacterToMagic(
  characters: Character[],
  characterId: string,
  magicSystemId: string,
  note?: string,
): Character[] {
  if (!characterId || !magicSystemId) return characters
  return characters.map((character) => {
    if (character.id !== characterId) return character
    const existing = character.magicLinks.find((link) => link.magicSystemId === magicSystemId)
    if (existing) {
      if (note === undefined) return character
      return {
        ...character,
        magicLinks: character.magicLinks.map((link) =>
          link.magicSystemId === magicSystemId ? { ...link, note } : link,
        ),
      }
    }
    return {
      ...character,
      magicLinks: [...character.magicLinks, { magicSystemId, note: note ?? '' }],
    }
  })
}

export function unlinkCharacterFromMagic(
  characters: Character[],
  characterId: string,
  magicSystemId: string,
): Character[] {
  return characters.map((character) =>
    character.id === characterId
      ? { ...character, magicLinks: character.magicLinks.filter((link) => link.magicSystemId !== magicSystemId) }
      : character,
  )
}

export function dropMagicLinksTo(characters: Character[], magicSystemId: string): Character[] {
  return characters.map((character) => ({
    ...character,
    magicLinks: character.magicLinks.filter((link) => link.magicSystemId !== magicSystemId),
  }))
}

export function practitionersForSystem(characters: Character[], magicSystemId: string) {
  return characters.flatMap((character) => {
    const link = character.magicLinks.find((entry) => entry.magicSystemId === magicSystemId)
    return link ? [{ character, note: link.note }] : []
  })
}
