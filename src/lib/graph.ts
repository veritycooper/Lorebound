import type { Relationship, Story } from '../types'
import { displayName, hydrateRelationship } from './entities'

export type GraphNodeKind = 'character' | 'place'

export type GraphNode = {
  id: string
  entityId: string
  kind: GraphNodeKind
  label: string
}

export type GraphEdge = {
  id: string
  source: string
  target: string
  label: string
}

export type StoryGraph = {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

export type GraphFilter = {
  kind: 'all' | 'character' | 'place'
  query: string
  showOrphans: boolean
}

export function graphNodeId(kind: GraphNodeKind, entityId: string): string {
  return `${kind}:${entityId}`
}

export function parseGraphNodeId(id: string): { kind: GraphNodeKind; entityId: string } | null {
  if (id.startsWith('character:')) return { kind: 'character', entityId: id.slice('character:'.length) }
  if (id.startsWith('place:')) return { kind: 'place', entityId: id.slice('place:'.length) }
  return null
}

function relationshipOf(raw: Relationship): Relationship {
  return hydrateRelationship(raw)
}

function addUndirectedEdge(map: Map<string, GraphEdge>, source: string, target: string, label: string) {
  if (source === target) return
  const [left, right] = source < target ? [source, target] : [target, source]
  const id = `${left}|${right}`
  const existing = map.get(id)
  const trimmed = label.trim()
  if (!existing) {
    map.set(id, { id, source: left, target: right, label: trimmed })
    return
  }
  if (!trimmed) return
  const parts = existing.label ? existing.label.split(' · ') : []
  if (!parts.includes(trimmed)) {
    existing.label = [...parts, trimmed].filter(Boolean).join(' · ')
  }
}

export function buildStoryGraph(story: Pick<Story, 'characters' | 'places'>): StoryGraph {
  const nodes: GraphNode[] = [
    ...story.characters.map((character) => ({
      id: graphNodeId('character', character.id),
      entityId: character.id,
      kind: 'character' as const,
      label: displayName(character.name, 'Unnamed character'),
    })),
    ...story.places.map((place) => ({
      id: graphNodeId('place', place.id),
      entityId: place.id,
      kind: 'place' as const,
      label: displayName(place.name, 'Unnamed place'),
    })),
  ]

  const known = new Set(nodes.map((node) => node.id))
  const edges = new Map<string, GraphEdge>()

  for (const character of story.characters) {
    const source = graphNodeId('character', character.id)
    for (const rel of character.relationships) {
      const hydrated = relationshipOf(rel)
      if (!hydrated.targetId) continue
      const target = graphNodeId(hydrated.targetKind, hydrated.targetId)
      if (!known.has(target)) continue
      addUndirectedEdge(edges, source, target, hydrated.kind)
    }
  }

  for (const place of story.places) {
    const source = graphNodeId('place', place.id)
    for (const otherId of place.connectedPlaceIds) {
      const target = graphNodeId('place', otherId)
      if (!known.has(target)) continue
      addUndirectedEdge(edges, source, target, '')
    }
  }

  return { nodes, edges: [...edges.values()] }
}

export function filterStoryGraph(graph: StoryGraph, filter: GraphFilter): StoryGraph {
  const query = filter.query.trim().toLowerCase()
  let nodes = graph.nodes.filter((node) => {
    if (filter.kind !== 'all' && node.kind !== filter.kind) return false
    if (query && !node.label.toLowerCase().includes(query)) return false
    return true
  })

  const allowed = new Set(nodes.map((node) => node.id))
  let edges = graph.edges.filter((edge) => allowed.has(edge.source) && allowed.has(edge.target))

  if (!filter.showOrphans) {
    const linked = new Set<string>()
    for (const edge of edges) {
      linked.add(edge.source)
      linked.add(edge.target)
    }
    nodes = nodes.filter((node) => linked.has(node.id))
    const remaining = new Set(nodes.map((node) => node.id))
    edges = edges.filter((edge) => remaining.has(edge.source) && remaining.has(edge.target))
  }

  return { nodes, edges }
}

export function neighborIds(edges: GraphEdge[], nodeId: string): Set<string> {
  const ids = new Set<string>([nodeId])
  for (const edge of edges) {
    if (edge.source === nodeId) ids.add(edge.target)
    if (edge.target === nodeId) ids.add(edge.source)
  }
  return ids
}

export function buildLocalGraph(
  story: Pick<Story, 'characters' | 'places'>,
  focus: { kind: GraphNodeKind; entityId: string },
): StoryGraph {
  const full = buildStoryGraph(story)
  const focusId = graphNodeId(focus.kind, focus.entityId)
  const hops = neighborIds(full.edges, focusId)
  const nodes = full.nodes.filter((node) => hops.has(node.id))
  const allowed = new Set(nodes.map((node) => node.id))
  const edges = full.edges.filter(
    (edge) =>
      allowed.has(edge.source) &&
      allowed.has(edge.target) &&
      (edge.source === focusId || edge.target === focusId),
  )
  return { nodes, edges }
}

export function starPositions(
  focusId: string,
  nodeIds: string[],
  width: number,
  height: number,
): Map<string, { x: number; y: number }> {
  const cx = width / 2
  const cy = height / 2
  const others = nodeIds.filter((id) => id !== focusId)
  const radius = Math.min(width, height) * 0.34
  const positions = new Map<string, { x: number; y: number }>()
  positions.set(focusId, { x: cx, y: cy })
  others.forEach((id, index) => {
    const angle = -Math.PI / 2 + (index / Math.max(others.length, 1)) * Math.PI * 2
    positions.set(id, {
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius,
    })
  })
  return positions
}
