import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react'
import { seedSimNodes, tickForce, type SimNode } from '../lib/forceLayout'
import { neighborIds, starPositions, type GraphEdge, type GraphNode } from '../lib/graph'

type Props = {
  nodes: GraphNode[]
  edges: GraphEdge[]
  selectedId: string | null
  onSelect?: (id: string | null) => void
  onOpen?: (node: GraphNode) => void
  layout?: 'force' | 'star'
  focusId?: string
  panZoom?: boolean
  className?: string
}

const NODE_FILL: Record<GraphNode['kind'], string> = {
  character: '#e4c48a',
  place: '#6d7d5c',
}

const NODE_STROKE: Record<GraphNode['kind'], string> = {
  character: '#c9a46a',
  place: '#8fa07d',
}

export function GraphCanvas({
  nodes,
  edges,
  selectedId,
  onSelect,
  onOpen,
  layout = 'force',
  focusId,
  panZoom = true,
  className,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 640, height: 420 })
  const [sim, setSim] = useState<SimNode[]>([])
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 })
  const simRef = useRef<SimNode[]>([])
  const alphaRef = useRef(1)
  const dragRef = useRef<{
    id: string | null
    moved: boolean
    pointer: number | null
    lastX: number
    lastY: number
    mode: 'node' | 'pan' | null
  }>({ id: null, moved: false, pointer: null, lastX: 0, lastY: 0, mode: null })

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      const box = entries[0]?.contentRect
      if (!box) return
      setSize({
        width: Math.max(240, box.width),
        height: Math.max(220, box.height),
      })
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const el = wrapRef.current
    if (!el || !panZoom) return
    const onNativeWheel = (event: WheelEvent) => {
      event.preventDefault()
      const rect = el.getBoundingClientRect()
      const mx = event.clientX - rect.left
      const my = event.clientY - rect.top
      setTransform((current) => {
        const factor = event.deltaY > 0 ? 0.92 : 1.08
        const nextK = Math.min(2.8, Math.max(0.35, current.k * factor))
        const wx = (mx - current.x) / current.k
        const wy = (my - current.y) / current.k
        return { k: nextK, x: mx - wx * nextK, y: my - wy * nextK }
      })
    }
    el.addEventListener('wheel', onNativeWheel, { passive: false })
    return () => el.removeEventListener('wheel', onNativeWheel)
  }, [panZoom])

  const ids = useMemo(() => nodes.map((node) => node.id), [nodes])
  const idKey = ids.join('|')
  const linkKey = edges.map((edge) => edge.id).join('|')

  useEffect(() => {
    if (layout !== 'force') return
    const previous = new Map(simRef.current.map((node) => [node.id, node]))
    const next = seedSimNodes(ids, previous, size.width, size.height)
    simRef.current = next
    setSim(next)
    alphaRef.current = 1
  }, [idKey, layout, size.width, size.height, ids])

  useEffect(() => {
    if (layout !== 'force') return
    alphaRef.current = Math.max(alphaRef.current, 0.7)
  }, [linkKey, layout])

  useEffect(() => {
    if (layout !== 'force') return
    let frame = 0
    const links = edges.map((edge) => ({ source: edge.source, target: edge.target }))
    const step = () => {
      if (alphaRef.current > 0.012) {
        const next = tickForce(simRef.current, links, {
          width: size.width,
          height: size.height,
          alpha: alphaRef.current,
        })
        simRef.current = next
        setSim(next)
        alphaRef.current *= 0.94
      }
      frame = window.requestAnimationFrame(step)
    }
    frame = window.requestAnimationFrame(step)
    return () => window.cancelAnimationFrame(frame)
  }, [layout, linkKey, size.width, size.height, edges])

  const star = useMemo(() => {
    if (layout !== 'star') return null
    const center = focusId ?? nodes[0]?.id ?? ''
    return starPositions(
      center,
      nodes.map((node) => node.id),
      size.width,
      size.height,
    )
  }, [layout, focusId, nodes, size.width, size.height])

  const positions = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>()
    if (layout === 'star' && star) return star
    for (const node of sim) map.set(node.id, { x: node.x, y: node.y })
    return map
  }, [layout, star, sim])

  const highlighted = useMemo(
    () => (selectedId ? neighborIds(edges, selectedId) : null),
    [edges, selectedId],
  )

  function worldPoint(clientX: number, clientY: number) {
    const rect = wrapRef.current?.getBoundingClientRect()
    if (!rect) return { x: 0, y: 0 }
    return {
      x: (clientX - rect.left - transform.x) / transform.k,
      y: (clientY - rect.top - transform.y) / transform.k,
    }
  }

  function onPointerDown(event: PointerEvent<Element>, nodeId?: string) {
    const target = event.currentTarget as Element
    if ('setPointerCapture' in target) {
      try {
        target.setPointerCapture(event.pointerId)
      } catch {
        /* SVG groups may not accept capture in every engine */
      }
    }
    dragRef.current = {
      id: nodeId ?? null,
      moved: false,
      pointer: event.pointerId,
      lastX: event.clientX,
      lastY: event.clientY,
      mode: nodeId ? 'node' : panZoom ? 'pan' : null,
    }
  }

  function onPointerMove(event: PointerEvent<Element>) {
    const drag = dragRef.current
    if (drag.pointer !== event.pointerId || !drag.mode) return
    const dx = event.clientX - drag.lastX
    const dy = event.clientY - drag.lastY
    if (Math.hypot(dx, dy) > 3) drag.moved = true
    drag.lastX = event.clientX
    drag.lastY = event.clientY

    if (drag.mode === 'pan') {
      setTransform((current) => ({ ...current, x: current.x + dx, y: current.y + dy }))
      return
    }

    if (drag.mode === 'node' && drag.id && layout === 'force') {
      const world = worldPoint(event.clientX, event.clientY)
      const next = simRef.current.map((node) =>
        node.id === drag.id ? { ...node, x: world.x, y: world.y, fx: world.x, fy: world.y, vx: 0, vy: 0 } : node,
      )
      simRef.current = next
      setSim(next)
      alphaRef.current = Math.max(alphaRef.current, 0.25)
    }
  }

  function onPointerUp(event: PointerEvent<Element>, node?: GraphNode) {
    const drag = dragRef.current
    if (drag.pointer !== event.pointerId) return
    drag.pointer = null
    if (!drag.moved) {
      if (node) onSelect?.(node.id)
      else onSelect?.(null)
    }
    drag.mode = null
    drag.id = null
  }

  return (
    <div
      ref={wrapRef}
      className={`graph-canvas ${className ?? ''}`.trim()}
      onPointerMove={onPointerMove}
      onPointerUp={(event) => onPointerUp(event)}
      onPointerCancel={(event) => onPointerUp(event)}
      onPointerDown={(event) => {
        if (event.target === event.currentTarget || (event.target as SVGElement).dataset.bg === '1') {
          onPointerDown(event)
        }
      }}
    >
      <svg width="100%" height="100%" role="img" aria-label="Story graph">
        <rect data-bg="1" width="100%" height="100%" fill="transparent" />
        <g transform={`translate(${transform.x} ${transform.y}) scale(${transform.k})`}>
          {edges.map((edge) => {
            const a = positions.get(edge.source)
            const b = positions.get(edge.target)
            if (!a || !b) return null
            const active = !highlighted || (highlighted.has(edge.source) && highlighted.has(edge.target))
            const dim = Boolean(highlighted && !active)
            return (
              <g key={edge.id} opacity={dim ? 0.12 : 1} pointerEvents="none">
                <line
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke={active && highlighted ? '#c9a46a' : 'rgba(201, 164, 106, 0.32)'}
                  strokeWidth={active && highlighted ? 1.6 : 1}
                />
                {edge.label && (!highlighted || active) ? (
                  <text
                    x={(a.x + b.x) / 2}
                    y={(a.y + b.y) / 2 - 6}
                    className="graph-edge-label"
                    textAnchor="middle"
                  >
                    {edge.label}
                  </text>
                ) : null}
              </g>
            )
          })}
          {nodes.map((node) => {
            const pos = positions.get(node.id)
            if (!pos) return null
            const selected = selectedId === node.id
            const dim = Boolean(highlighted && !highlighted.has(node.id))
            const radius = selected ? 8.5 : 6.5
            return (
              <g
                key={node.id}
                transform={`translate(${pos.x} ${pos.y})`}
                opacity={dim ? 0.18 : 1}
                className="graph-node"
                onPointerDown={(event) => {
                  event.stopPropagation()
                  onPointerDown(event, node.id)
                }}
                onPointerUp={(event) => {
                  event.stopPropagation()
                  onPointerUp(event, node)
                }}
                onDoubleClick={(event) => {
                  event.stopPropagation()
                  onOpen?.(node)
                }}
                style={{ cursor: 'pointer' }}
              >
                <circle r={18} fill="transparent" />
                {selected ? (
                  <circle r={radius + 6} fill="rgba(201, 164, 106, 0.18)" />
                ) : null}
                <circle
                  r={radius}
                  fill={NODE_FILL[node.kind]}
                  stroke={selected ? '#f0d9a8' : NODE_STROKE[node.kind]}
                  strokeWidth={selected ? 1.6 : 1}
                />
                <text className="graph-node-label" y={radius + 12} textAnchor="middle">
                  {node.label}
                </text>
              </g>
            )
          })}
        </g>
      </svg>
    </div>
  )
}

export function GraphLegend() {
  return (
    <div className="graph-legend" aria-hidden="true">
      <span>
        <i className="graph-swatch person" /> People
      </span>
      <span>
        <i className="graph-swatch place" /> Places
      </span>
    </div>
  )
}
