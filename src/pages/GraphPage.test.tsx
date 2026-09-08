import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { emptyCharacter, emptyPlace, emptyRelationship, emptyStory } from '../lib/entities'
import GraphPage from './GraphPage'

const storyApi = vi.hoisted(() => ({
  story: emptyStory({
    id: 's1',
    characters: [
      emptyCharacter({
        id: 'lira',
        name: 'Lira',
        relationships: [emptyRelationship({ targetKind: 'place', targetId: 'mill', kind: 'lives in' })],
      }),
    ],
    places: [emptyPlace({ id: 'mill', name: 'The Mill' })],
  }),
  addCharacter: vi.fn(),
  addPlace: vi.fn(),
}))

vi.mock('../context/StoryContext', () => ({
  useStory: () => storyApi,
}))

describe('GraphPage', () => {
  it('still renders the story graph view', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/story/s1/graph']}>
        <Routes>
          <Route path="/story/:storyId/graph" element={<GraphPage />} />
        </Routes>
      </MemoryRouter>,
    )
    expect(html).toContain('Story graph')
    expect(html).toContain('Graph')
    expect(html).toContain('People')
    expect(html).toContain('Places')
  })
})
