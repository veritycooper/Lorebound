import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { EmptyState } from '../components/EmptyState'
import { GraphCanvas, GraphLegend } from '../components/GraphCanvas'
import { useStory } from '../context/StoryContext'
import { buildStoryGraph, filterStoryGraph, parseGraphNodeId, type GraphFilter } from '../lib/graph'

const KIND_FILTERS: { value: GraphFilter['kind']; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'character', label: 'People' },
  { value: 'place', label: 'Places' },
]

export default function GraphPage() {
  const { story, addCharacter, addPlace } = useStory()
  const navigate = useNavigate()
  const [kind, setKind] = useState<GraphFilter['kind']>('all')
  const [query, setQuery] = useState('')
  const [showOrphans, setShowOrphans] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const full = useMemo(() => buildStoryGraph(story), [story])
  const graph = useMemo(
    () => filterStoryGraph(full, { kind, query, showOrphans }),
    [full, kind, query, showOrphans],
  )

  const selected = graph.nodes.find((node) => node.id === selectedId) ?? null
  const selectedEdges = selected
    ? graph.edges.filter((edge) => edge.source === selected.id || edge.target === selected.id)
    : []

  const hasWorld = story.characters.length + story.places.length > 0

  function openNode(nodeId: string) {
    const parsed = parseGraphNodeId(nodeId)
    if (!parsed) return
    if (parsed.kind === 'character') navigate(`../characters/${parsed.entityId}`)
    else navigate(`../places/${parsed.entityId}`)
  }

  return (
    <div className="graph-page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Constellation</p>
          <h1>Graph</h1>
        </div>
        <GraphLegend />
      </header>

      {!hasWorld ? (
        <EmptyState
          title="Nothing to map yet"
          body="Add a character, a place, or a link between them. This view is their quiet constellation — people in brass, places in moss."
          action={
            <div className="row" style={{ justifyContent: 'center' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => navigate(`../characters/${addCharacter().id}`)}
              >
                New character
              </button>
              <button type="button" className="btn" onClick={() => navigate(`../places/${addPlace().id}`)}>
                New place
              </button>
            </div>
          }
        />
      ) : (
        <>
          <div className="graph-toolbar">
            <div className="segmented" role="tablist" aria-label="Graph filter">
              {KIND_FILTERS.map((entry) => (
                <button
                  key={entry.value}
                  type="button"
                  className={kind === entry.value ? 'active' : undefined}
                  onClick={() => setKind(entry.value)}
                >
                  {entry.label}
                </button>
              ))}
            </div>
            <input
              className="input graph-search"
              value={query}
              placeholder="Search names"
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Search graph"
            />
            <label className="graph-check">
              <input
                type="checkbox"
                checked={showOrphans}
                onChange={(event) => setShowOrphans(event.target.checked)}
              />
              Isolates
            </label>
          </div>

          {graph.nodes.length === 0 ? (
            <EmptyState
              title="Nothing matches"
              body="Try All, clear the search, or show isolates — unlinked people and places wait at the edges."
            />
          ) : (
            <div className="graph-stage">
              <GraphCanvas
                nodes={graph.nodes}
                edges={graph.edges}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onOpen={(node) => openNode(node.id)}
              />
              {selected ? (
                <div className="graph-inspect">
                  <p className="eyebrow">{selected.kind === 'character' ? 'Person' : 'Place'}</p>
                  <h2>{selected.label}</h2>
                  {selectedEdges.length === 0 ? (
                    <p className="muted small">Unlinked — add a relationship or a road.</p>
                  ) : (
                    <ul>
                      {selectedEdges.map((edge) => {
                        const otherId = edge.source === selected.id ? edge.target : edge.source
                        const other = graph.nodes.find((node) => node.id === otherId)
                        return (
                          <li key={edge.id}>
                            {edge.label ? `${edge.label} ` : ''}
                            {other?.label ?? 'unknown'}
                          </li>
                        )
                      })}
                    </ul>
                  )}
                  <button type="button" className="btn btn-small" onClick={() => openNode(selected.id)}>
                    Open
                  </button>
                </div>
              ) : (
                <p className="graph-hint">Click a node to see neighbors. Double-click to open.</p>
              )}
            </div>
          )}
          <p className="hint" style={{ marginTop: '0.8rem' }}>
            Links come from character relationships and connected places.{' '}
            <Link to="../characters">Edit people</Link> or <Link to="../places">places</Link>.
          </p>
        </>
      )}
    </div>
  )
}
