export type StoryStatus = 'seed' | 'drafting' | 'revising' | 'complete'

export type PlaceType =
  | 'city'
  | 'region'
  | 'landmark'
  | 'interior'
  | 'wilderness'
  | 'other'

export type Relationship = {
  id: string
  otherCharacterId: string
  kind: string
  notes: string
}

export type Character = {
  id: string
  name: string
  role: string
  aliases: string
  appearance: string
  personality: string
  notes: string
  imageId: string | null
  pinterestUrl: string
  relationships: Relationship[]
}

export type MagicSystem = {
  id: string
  name: string
  rules: string
  costs: string
  whoCanUse: string
  notes: string
}

export type Law = {
  id: string
  title: string
  text: string
}

export type LegalSystem = {
  id: string
  name: string
  region: string
  principles: string
  laws: Law[]
  notes: string
}

export type Place = {
  id: string
  name: string
  type: PlaceType
  description: string
  connectedPlaceIds: string[]
  mapImageId: string | null
  notes: string
}

export type Chapter = {
  id: string
  title: string
  body: string
  updatedAt: number
}

export type SceneIdea = {
  id: string
  title: string
  body: string
  tags: string[]
  createdAt: number
}

export type Story = {
  id: string
  title: string
  summary: string
  status: StoryStatus
  createdAt: number
  updatedAt: number
  characters: Character[]
  magicSystems: MagicSystem[]
  legalSystems: LegalSystem[]
  places: Place[]
  chapters: Chapter[]
  sceneIdeas: SceneIdea[]
}

export type ImageRecord = {
  id: string
  data: ArrayBuffer
  mimeType: string
  name: string
  createdAt: number
}

export type ExportedImage = {
  id: string
  mimeType: string
  name: string
  dataUrl: string
}

export type LoreboundExport = {
  version: 1
  app: 'lorebound'
  exportedAt: string
  stories: Story[]
  images: ExportedImage[]
}

export const STORY_STATUSES: { value: StoryStatus; label: string }[] = [
  { value: 'seed', label: 'Seed' },
  { value: 'drafting', label: 'Drafting' },
  { value: 'revising', label: 'Revising' },
  { value: 'complete', label: 'Complete' },
]

export const PLACE_TYPES: { value: PlaceType; label: string }[] = [
  { value: 'city', label: 'City' },
  { value: 'region', label: 'Region' },
  { value: 'landmark', label: 'Landmark' },
  { value: 'interior', label: 'Interior' },
  { value: 'wilderness', label: 'Wilderness' },
  { value: 'other', label: 'Other' },
]
