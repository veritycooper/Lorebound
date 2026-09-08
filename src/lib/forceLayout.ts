export type SimNode = {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  fx: number | null
  fy: number | null
}

export type SimLink = {
  source: string
  target: string
}

export function seedSimNodes(
  ids: string[],
  previous: Map<string, SimNode>,
  width: number,
  height: number,
): SimNode[] {
  const cx = width / 2
  const cy = height / 2
  const radius = Math.min(width, height) * 0.24 || 80
  return ids.map((id, index) => {
    const kept = previous.get(id)
    if (kept) {
      return {
        ...kept,
        id,
        x: Number.isFinite(kept.x) ? kept.x : cx,
        y: Number.isFinite(kept.y) ? kept.y : cy,
      }
    }
    const angle = (index / Math.max(ids.length, 1)) * Math.PI * 2
    const jitter = ((index * 17) % 7) - 3
    return {
      id,
      x: cx + Math.cos(angle) * radius + jitter,
      y: cy + Math.sin(angle) * radius + jitter,
      vx: 0,
      vy: 0,
      fx: null,
      fy: null,
    }
  })
}

export function tickForce(
  nodes: SimNode[],
  links: SimLink[],
  opts: { width: number; height: number; alpha: number },
): SimNode[] {
  const { width, height, alpha } = opts
  const next = nodes.map((node) => ({ ...node }))
  const byId = new Map(next.map((node) => [node.id, node]))
  const charge = -280
  const linkDistance = next.length > 12 ? 72 : 96
  const linkStrength = 0.07
  const collide = 18

  for (let i = 0; i < next.length; i += 1) {
    for (let j = i + 1; j < next.length; j += 1) {
      const a = next[i]!
      const b = next[j]!
      let dx = b.x - a.x
      let dy = b.y - a.y
      let distSq = dx * dx + dy * dy
      if (distSq < 0.01) {
        dx = 0.01
        dy = 0.01
        distSq = 0.0002
      }
      const dist = Math.sqrt(distSq)
      const force = (charge * alpha) / distSq
      const fx = (dx / dist) * force
      const fy = (dy / dist) * force
      a.vx += fx
      a.vy += fy
      b.vx -= fx
      b.vy -= fy

      if (dist < collide * 2) {
        const overlap = ((collide * 2 - dist) / dist) * 0.08 * alpha
        a.vx -= dx * overlap
        a.vy -= dy * overlap
        b.vx += dx * overlap
        b.vy += dy * overlap
      }
    }
  }

  for (const link of links) {
    const a = byId.get(link.source)
    const b = byId.get(link.target)
    if (!a || !b) continue
    let dx = b.x - a.x
    let dy = b.y - a.y
    const dist = Math.sqrt(dx * dx + dy * dy) || 0.01
    const k = (dist - linkDistance) * linkStrength * alpha
    const fx = (dx / dist) * k
    const fy = (dy / dist) * k
    a.vx += fx
    a.vy += fy
    b.vx -= fx
    b.vy -= fy
  }

  const cx = width / 2
  const cy = height / 2
  const centering = 0.018 * alpha
  const damp = 0.81

  for (const node of next) {
    node.vx += (cx - node.x) * centering
    node.vy += (cy - node.y) * centering

    if (node.fx != null) {
      node.x = node.fx
      node.vx = 0
    } else {
      node.vx *= damp
      node.x += node.vx
    }

    if (node.fy != null) {
      node.y = node.fy
      node.vy = 0
    } else {
      node.vy *= damp
      node.y += node.vy
    }
  }

  return next
}
