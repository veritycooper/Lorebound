import { describe, expect, it } from 'vitest'
import { emptyCharacter, emptyPlace, emptyRelationship, emptyStory, hydrateRelationship } from './entities'
import { tickForce, seedSimNodes } from './forceLayout'
import {
  buildLocalGraph,
  buildStoryGraph,
  filterStoryGraph,
  graphNodeId,
  neighborIds,
  starPositions,
} from './graph'

describe('hydrateRelationship', () => {
  it('keeps structured target fields', () => {
    expect(
      hydrateRelationship({
        id: 'r1',
        targetKind: 'place',
        targetId: 'p1',
        kind: 'lives in',
        notes: 'the mill loft',
      }),
    ).toEqual({
      id: 'r1',
      targetKind: 'place',
      targetId: 'p1',
      kind: 'lives in',
      notes: 'the mill loft',
    })
  })

  it('migrates legacy otherCharacterId rows', () => {
    expect(
      hydrateRelationship({
        id: 'r2',
        otherCharacterId: 'c9',
        kind: 'rivals',
        notes: '',
      }),
    ).toEqual({
      id: 'r2',
      targetKind: 'character',
      targetId: 'c9',
      kind: 'rivals',
      notes: '',
    })
  })

  it('serializes as JSON without the legacy field', () => {
    const rel = emptyRelationship({ targetKind: 'place', targetId: 'ash', kind: 'lives in' })
    const roundTrip = JSON.parse(JSON.stringify(rel)) as Record<string, unknown>
    expect(roundTrip).not.toHaveProperty('otherCharacterId')
    expect(hydrateRelationship(roundTrip)).toMatchObject({
      targetKind: 'place',
      targetId: 'ash',
      kind: 'lives in',
    })
  })
})

describe('buildStoryGraph', () => {
  const lira = emptyCharacter({
    id: 'lira',
    name: 'Lira',
    relationships: [
      emptyRelationship({ id: 'e1', targetKind: 'place', targetId: 'mill', kind: 'lives in' }),
      emptyRelationship({ id: 'e2', targetKind: 'character', targetId: 'corvin', kind: 'rivals' }),
      emptyRelationship({ id: 'e3', targetKind: 'character', targetId: 'ghost', kind: 'haunted by' }),
    ],
  })
  const corvin = emptyCharacter({ id: 'corvin', name: 'Corvin' })
  const mill = emptyPlace({ id: 'mill', name: 'Ashwood Mill', connectedPlaceIds: ['ford'] })
  const ford = emptyPlace({ id: 'ford', name: 'Low Ford', connectedPlaceIds: ['mill'] })

  const story = emptyStory({
    characters: [lira, corvin],
    places: [mill, ford],
  })

  it('builds a node per character and place', () => {
    const graph = buildStoryGraph(story)
    expect(graph.nodes.map((node) => node.id).sort()).toEqual([
      'character:corvin',
      'character:lira',
      'place:ford',
      'place:mill',
    ])
    expect(graph.nodes.find((node) => node.id === 'character:lira')?.kind).toBe('character')
    expect(graph.nodes.find((node) => node.id === 'place:mill')?.kind).toBe('place')
  })

  it('turns relationships and place links into undirected edges', () => {
    const graph = buildStoryGraph(story)
    const labels = Object.fromEntries(graph.edges.map((edge) => [edge.id, edge.label]))
    expect(labels['character:lira|place:mill']).toBe('lives in')
    expect(labels['character:corvin|character:lira']).toBe('rivals')
    expect(labels['place:ford|place:mill']).toBe('')
    expect(graph.edges.some((edge) => edge.id.includes('ghost'))).toBe(false)
  })

  it('reads legacy relationship rows when building edges', () => {
    const graph = buildStoryGraph({
      characters: [
        emptyCharacter({
          id: 'a',
          name: 'A',
          relationships: [{ id: 'old', otherCharacterId: 'b', kind: 'mentor', notes: '' } as never],
        }),
        emptyCharacter({ id: 'b', name: 'B' }),
      ],
      places: [],
    })
    expect(graph.edges).toEqual([
      {
        id: 'character:a|character:b',
        source: 'character:a',
        target: 'character:b',
        label: 'mentor',
      },
    ])
  })
})

describe('filterStoryGraph', () => {
  const graph = buildStoryGraph(
    emptyStory({
      characters: [
        emptyCharacter({
          id: 'lira',
          name: 'Lira',
          relationships: [emptyRelationship({ targetKind: 'character', targetId: 'corvin', kind: 'rivals' })],
        }),
        emptyCharacter({ id: 'corvin', name: 'Corvin' }),
        emptyCharacter({ id: 'orio', name: 'Orio' }),
      ],
      places: [emptyPlace({ id: 'mill', name: 'Ashwood Mill' })],
    }),
  )

  it('can keep only people', () => {
    const filtered = filterStoryGraph(graph, { kind: 'character', query: '', showOrphans: true })
    expect(filtered.nodes.every((node) => node.kind === 'character')).toBe(true)
    expect(filtered.edges).toHaveLength(1)
  })

  it('hides isolates when asked', () => {
    const filtered = filterStoryGraph(graph, { kind: 'all', query: '', showOrphans: false })
    expect(filtered.nodes.map((node) => node.id).sort()).toEqual(['character:corvin', 'character:lira'])
  })

  it('filters by name', () => {
    const filtered = filterStoryGraph(graph, { kind: 'all', query: 'mill', showOrphans: true })
    expect(filtered.nodes.map((node) => node.label)).toEqual(['Ashwood Mill'])
    expect(filtered.edges).toEqual([])
  })
})

describe('local graph', () => {
  it('keeps the focus node and one hop of links', () => {
    const story = emptyStory({
      characters: [
        emptyCharacter({
          id: 'lira',
          name: 'Lira',
          relationships: [
            emptyRelationship({ targetKind: 'place', targetId: 'mill', kind: 'lives in' }),
            emptyRelationship({ targetKind: 'character', targetId: 'corvin', kind: 'rivals' }),
          ],
        }),
        emptyCharacter({ id: 'corvin', name: 'Corvin' }),
        emptyCharacter({ id: 'orio', name: 'Orio' }),
      ],
      places: [emptyPlace({ id: 'mill', name: 'Ashwood Mill' })],
    })
    const local = buildLocalGraph(story, { kind: 'character', entityId: 'lira' })
    expect(local.nodes.map((node) => node.id).sort()).toEqual([
      'character:corvin',
      'character:lira',
      'place:mill',
    ])
    expect(local.edges).toHaveLength(2)
  })

  it('places neighbors on a ring around the focus', () => {
    const focus = graphNodeId('character', 'lira')
    const positions = starPositions(focus, [focus, 'character:corvin', 'place:mill'], 200, 200)
    expect(positions.get(focus)).toEqual({ x: 100, y: 100 })
    expect(positions.size).toBe(3)
  })
})

describe('neighborIds', () => {
  it('includes the selected node and adjacent ids', () => {
    const ids = neighborIds(
      [{ id: 'a|b', source: 'a', target: 'b', label: '' }],
      'a',
    )
    expect([...ids].sort()).toEqual(['a', 'b'])
  })
})

describe('tickForce', () => {
  it('keeps positions finite and pinned nodes still', () => {
    const nodes = seedSimNodes(['a', 'b'], new Map(), 400, 300)
    nodes[0]!.fx = 10
    nodes[0]!.fy = 20
    let current = nodes
    for (let i = 0; i < 12; i += 1) {
      current = tickForce(current, [{ source: 'a', target: 'b' }], { width: 400, height: 300, alpha: 0.6 })
    }
    expect(current[0]).toMatchObject({ x: 10, y: 20 })
    for (const node of current) {
      expect(Number.isFinite(node.x)).toBe(true)
      expect(Number.isFinite(node.y)).toBe(true)
    }
  })
})
