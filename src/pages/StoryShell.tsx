import { useState } from 'react'
import { NavLink, Outlet, Link } from 'react-router-dom'
import { LastSaved } from '../components/LastSaved'
import { useStory } from '../context/StoryContext'

const links = [
  { to: '', label: 'Overview', key: 'overview' },
  { to: 'characters', label: 'Characters', key: 'characters' },
  { to: 'magic', label: 'Magic', key: 'magic' },
  { to: 'laws', label: 'Laws', key: 'laws' },
  { to: 'places', label: 'Places', key: 'places' },
  { to: 'graph', label: 'Graph', key: 'graph' },
  { to: 'writing', label: 'Writing', key: 'writing' },
  { to: 'ideas', label: 'Scene ideas', key: 'ideas' },
  { to: 'backup', label: 'Backup', key: 'backup' },
] as const

export default function StoryShell() {
  const { story, saveStatus, lastSavedAt } = useStory()
  const [menuOpen, setMenuOpen] = useState(false)

  const counts: Record<(typeof links)[number]['key'], number | null> = {
    overview: null,
    characters: story.characters.length,
    magic: story.magicSystems.length,
    laws: story.legalSystems.length,
    places: story.places.length,
    graph: null,
    writing: story.chapters.length,
    ideas: story.sceneIdeas.length,
    backup: null,
  }

  return (
    <div className="shell">
      {menuOpen ? (
        <button
          type="button"
          className="modal-backdrop"
          aria-label="Close contents"
          onClick={() => setMenuOpen(false)}
          style={{ background: 'rgba(8,6,5,0.55)' }}
        />
      ) : null}
      <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <Link className="brand" to="/" onClick={() => setMenuOpen(false)}>
          <span className="brand-mark">L</span>
          <span>Lorebound</span>
        </Link>
        <div className="sidebar-story">
          <p className="eyebrow">Now open</p>
          <h2>{story.title}</h2>
        </div>
        <nav className="nav">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === ''}
              className={({ isActive }) => (isActive ? 'active' : undefined)}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
              {counts[link.key] !== null ? <span className="count">{counts[link.key]}</span> : <span />}
            </NavLink>
          ))}
        </nav>
        <div style={{ marginTop: '1.6rem' }}>
          <LastSaved status={saveStatus} lastSavedAt={lastSavedAt} />
        </div>
      </aside>
      <div className="main">
        <div className="topbar-mobile">
          <button type="button" className="btn menu-toggle" onClick={() => setMenuOpen(true)}>
            Contents
          </button>
          <LastSaved status={saveStatus} lastSavedAt={lastSavedAt} />
        </div>
        <Outlet />
      </div>
    </div>
  )
}
