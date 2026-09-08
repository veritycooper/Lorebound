import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  deleteImage as deleteStoredImage,
  getLastSavedAt,
  getStory,
  saveImage as persistImage,
  saveStory,
} from '../db'
import {
  emptyChapter,
  emptyCharacter,
  emptyLegalSystem,
  emptyMagicSystem,
  emptyPlace,
  emptySceneIdea,
  touchStory,
} from '../lib/entities'
import type {
  Chapter,
  Character,
  LegalSystem,
  MagicSystem,
  Place,
  SceneIdea,
  Story,
} from '../types'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

type StoryContextValue = {
  story: Story
  saveStatus: SaveStatus
  lastSavedAt: number | null
  updateStory: (patch: Partial<Story>) => void
  setCharacters: (characters: Character[]) => void
  setMagicSystems: (magicSystems: MagicSystem[]) => void
  setLegalSystems: (legalSystems: LegalSystem[]) => void
  setPlaces: (places: Place[]) => void
  setChapters: (chapters: Chapter[]) => void
  setSceneIdeas: (sceneIdeas: SceneIdea[]) => void
  addCharacter: () => Character
  addMagicSystem: () => MagicSystem
  addLegalSystem: () => LegalSystem
  addPlace: () => Place
  addChapter: () => Chapter
  addSceneIdea: (idea?: Partial<SceneIdea>) => SceneIdea
  saveImageFile: (file: File) => Promise<string>
  removeImage: (id: string) => Promise<void>
  persistNow: () => Promise<void>
}

const StoryContext = createContext<StoryContextValue | null>(null)

export function StoryProvider({ children }: { children: ReactNode }) {
  const { storyId } = useParams()
  const [story, setStory] = useState<Story | null>(null)
  const [missing, setMissing] = useState(false)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null)
  const skipNextSave = useRef(true)
  const storyRef = useRef<Story | null>(null)
  const dirtyRef = useRef(false)

  useEffect(() => {
    storyRef.current = story
  }, [story])

  useEffect(() => {
    let cancelled = false
    if (!storyId) return
    setStory(null)
    setMissing(false)
    skipNextSave.current = true
    void (async () => {
      const found = await getStory(storyId)
      const saved = await getLastSavedAt()
      if (cancelled) return
      if (!found) {
        setMissing(true)
        return
      }
      setStory(found)
      setLastSavedAt(saved)
      setSaveStatus('saved')
    })()
    return () => {
      cancelled = true
    }
  }, [storyId])

  const persistNow = useCallback(async () => {
    const current = storyRef.current
    if (!current) return
    setSaveStatus('saving')
    try {
      await saveStory(current)
      dirtyRef.current = false
      const saved = await getLastSavedAt()
      setLastSavedAt(saved)
      setSaveStatus('saved')
    } catch {
      setSaveStatus('error')
    }
  }, [])

  useEffect(() => {
    if (!story) return
    if (skipNextSave.current) {
      skipNextSave.current = false
      return
    }
    dirtyRef.current = true
    setSaveStatus('saving')
    const handle = window.setTimeout(() => {
      void persistNow()
    }, 450)
    return () => window.clearTimeout(handle)
  }, [story, persistNow])

  useEffect(() => {
    const flush = () => {
      if (dirtyRef.current) void persistNow()
    }
    window.addEventListener('beforeunload', flush)
    return () => {
      window.removeEventListener('beforeunload', flush)
      flush()
    }
  }, [persistNow])

  const updateStory = useCallback((patch: Partial<Story>) => {
    setStory((current) => (current ? touchStory(current, patch) : current))
  }, [])

  const setCharacters = useCallback((characters: Character[]) => updateStory({ characters }), [updateStory])
  const setMagicSystems = useCallback((magicSystems: MagicSystem[]) => updateStory({ magicSystems }), [updateStory])
  const setLegalSystems = useCallback((legalSystems: LegalSystem[]) => updateStory({ legalSystems }), [updateStory])
  const setPlaces = useCallback((places: Place[]) => updateStory({ places }), [updateStory])
  const setChapters = useCallback((chapters: Chapter[]) => updateStory({ chapters }), [updateStory])
  const setSceneIdeas = useCallback((sceneIdeas: SceneIdea[]) => updateStory({ sceneIdeas }), [updateStory])

  const addCharacter = useCallback(() => {
    const entity = emptyCharacter()
    setCharacters([...(storyRef.current?.characters ?? []), entity])
    return entity
  }, [setCharacters])

  const addMagicSystem = useCallback(() => {
    const entity = emptyMagicSystem()
    setMagicSystems([...(storyRef.current?.magicSystems ?? []), entity])
    return entity
  }, [setMagicSystems])

  const addLegalSystem = useCallback(() => {
    const entity = emptyLegalSystem()
    setLegalSystems([...(storyRef.current?.legalSystems ?? []), entity])
    return entity
  }, [setLegalSystems])

  const addPlace = useCallback(() => {
    const entity = emptyPlace()
    setPlaces([...(storyRef.current?.places ?? []), entity])
    return entity
  }, [setPlaces])

  const addChapter = useCallback(() => {
    const entity = emptyChapter()
    setChapters([...(storyRef.current?.chapters ?? []), entity])
    return entity
  }, [setChapters])

  const addSceneIdea = useCallback(
    (idea?: Partial<SceneIdea>) => {
      const entity = emptySceneIdea(idea)
      setSceneIdeas([entity, ...(storyRef.current?.sceneIdeas ?? [])])
      return entity
    },
    [setSceneIdeas],
  )

  const saveImageFile = useCallback(async (file: File) => persistImage(file), [])
  const removeImage = useCallback(async (id: string) => deleteStoredImage(id), [])

  const value = useMemo(
    () =>
      story
        ? {
            story,
            saveStatus,
            lastSavedAt,
            updateStory,
            setCharacters,
            setMagicSystems,
            setLegalSystems,
            setPlaces,
            setChapters,
            setSceneIdeas,
            addCharacter,
            addMagicSystem,
            addLegalSystem,
            addPlace,
            addChapter,
            addSceneIdea,
            saveImageFile,
            removeImage,
            persistNow,
          }
        : null,
    [
      story,
      saveStatus,
      lastSavedAt,
      updateStory,
      setCharacters,
      setMagicSystems,
      setLegalSystems,
      setPlaces,
      setChapters,
      setSceneIdeas,
      addCharacter,
      addMagicSystem,
      addLegalSystem,
      addPlace,
      addChapter,
      addSceneIdea,
      saveImageFile,
      removeImage,
      persistNow,
    ],
  )

  if (missing) {
    return (
      <div className="main">
        <div className="empty">
          <h2>This volume is missing</h2>
          <p>It may have been deleted, or this link belongs to another library in this browser.</p>
          <Link className="btn btn-primary" to="/">
            Return to the library
          </Link>
        </div>
      </div>
    )
  }

  if (!value) {
    return (
      <div className="main">
        <p className="muted">Opening the volume…</p>
      </div>
    )
  }

  return <StoryContext.Provider value={value}>{children}</StoryContext.Provider>
}

export function useStory() {
  const value = useContext(StoryContext)
  if (!value) {
    throw new Error('useStory must be used inside a story')
  }
  return value
}
