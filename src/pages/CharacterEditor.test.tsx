import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { emptyCharacter, emptyMagicSystem, emptyPlace, emptyRelationship, emptyStory } from '../lib/entities'
import CharacterEditor from './CharacterEditor'

const storyApi = vi.hoisted(() => ({
  story: {} as ReturnType<typeof emptyStory>,
  setCharacters: vi.fn(),
  updateStory: vi.fn(),
  saveImageFile: vi.fn(),
  removeImage: vi.fn(),
}))

vi.mock('../context/StoryContext', () => ({
  useStory: () => storyApi,
}))

describe('CharacterEditor', () => {
  beforeEach(() => {
    storyApi.story = emptyStory({
      id: 's1',
      title: 'Ashwood',
      characters: [
        emptyCharacter({
          id: 'lira',
          name: 'Lira',
          role: 'baker',
          species: 'Ashfolk',
          height: { feet: 5, inches: 7 },
          relationships: [emptyRelationship({ targetKind: 'place', targetId: 'mill', kind: 'lives in' })],
          magicLinks: [{ magicSystemId: 'hearth', note: 'oven-warm' }],
        }),
      ],
      magicSystems: [emptyMagicSystem({ id: 'hearth', name: 'Hearth-binding' })],
      places: [emptyPlace({ id: 'mill', name: 'The Mill' })],
    })
  })

  it('does not render a local graph and shows structured identity plus magic', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/story/s1/characters/lira']}>
        <Routes>
          <Route path="/story/:storyId/characters/:entityId" element={<CharacterEditor />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(html).not.toContain('local-graph')
    expect(html).not.toContain('Story graph')
    expect(html).not.toContain('one hop of links')
    expect(html).toContain('Species')
    expect(html).toContain('Height')
    expect(html).toContain('Height in feet')
    expect(html).toContain('Height in inches')
    expect(html).toContain('5′7″')
    expect(html).toContain('Ashfolk')
    expect(html).toContain('Magic')
    expect(html).toContain('Hearth-binding')
    expect(html).toContain('lives in')
    expect(html).toContain('Pinterest')
  })
})
