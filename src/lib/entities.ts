import type {
  Chapter,
  Character,
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
    appearance: '',
    personality: '',
    notes: '',
    imageId: null,
    pinterestUrl: '',
    relationships: [],
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
  const { relationships, ...rest } = record
  const base = emptyCharacter(rest as Partial<Character>)
  return {
    ...base,
    relationships: Array.isArray(relationships) ? relationships.map((entry) => hydrateRelationship(entry)) : [],
  }
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
  const record = raw && typeof raw === 'object' ? (raw as Partial<Story>) : {}
  const base = emptyStory(record)
  return {
    ...base,
    characters: Array.isArray(record.characters) ? record.characters.map((entry) => hydrateCharacter(entry)) : [],
    magicSystems: Array.isArray(record.magicSystems) ? record.magicSystems : [],
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
