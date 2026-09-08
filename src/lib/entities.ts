import type {
  Chapter,
  Character,
  LegalSystem,
  MagicSystem,
  Place,
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
