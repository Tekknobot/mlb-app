import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

const primaryTabs = [
  { to: '/', label: 'Dashboard' },
  { to: '/matchups', label: 'Matchups' },
  { to: '/teams', label: 'Teams' },
  { to: '/players', label: 'Players' },
] as const

const secondaryTabs = [
  { to: '/about', label: 'About' },
  { to: '/terms', label: 'Terms' },
  { to: '/privacy', label: 'Privacy' },
] as const

function BallMark() {
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0">
      <circle cx="12" cy="12" r="9" className="stroke-gray-200/90" strokeWidth="1.4" />
      <path d="M6.2 6.2c2.5 2.5 2.5 9.1 0 11.6" className="stroke-seam" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M17.8 6.2c-2.5 2.5-2.5 9.1 0 11.6" className="stroke-seam" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M7.4 8.4l1.6 1.2M7.1 10.5l1.9.7M7.1 13l1.9-.7M7.4 15.2l1.6-1.2" className="stroke-seam/80" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M16.6 8.4l-1.6 1.2M16.9 10.5l-1.9.7M16.9 13l-1.9-.7M16.6 15.2l-1.6-1.2" className="stroke-seam/80" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

function NavLink({ to, label, active, compact = false }: { to: string; label: string; active: boolean; compact?: boolean }) {
  return (
    <Link
      to={to}
      className={compact
        ? `rounded-xl px-3 py-2 text-sm font-medium transition ${active ? 'bg-white text-diamond' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`
        : `rounded-full px-3 py-2 text-sm font-medium transition ${active ? 'bg-white text-diamond shadow-sm' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}
    >
      {label}
    </Link>
  )
}

export default function NavBar() {
  const loc = useLocation()
  const [open, setOpen] = useState(false)

  useEffect(() => setOpen(false), [loc.pathname])
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <>
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/10 bg-outfield/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex min-w-0 items-center gap-3">
            <BallMark />
            <div className="min-w-0">
              <div className="truncate text-sm font-black uppercase tracking-[0.22em] text-white">PennantGrid</div>
              <div className="truncate text-xs text-gray-400">Mobile-first MLB scoreboard & matchup tracker</div>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-2">
            {primaryTabs.map(tab => <NavLink key={tab.to} to={tab.to} label={tab.label} active={loc.pathname === tab.to} />)}
          </div>

          <div className="hidden lg:flex items-center gap-2 text-xs text-gray-400">
            {secondaryTabs.map(tab => (
              <Link key={tab.to} to={tab.to} className={`rounded-full px-3 py-1.5 transition ${loc.pathname === tab.to ? 'bg-white/10 text-white' : 'hover:text-white'}`}>
                {tab.label}
              </Link>
            ))}
          </div>

          <button
            type="button"
            className="lg:hidden inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 p-2 text-gray-200 hover:bg-white/10 hover:text-white"
            onClick={() => setOpen(v => !v)}
            aria-label="Open navigation menu"
            aria-expanded={open}
            aria-controls="mobile-menu"
          >
            <svg className={`${open ? 'hidden' : 'block'}`} width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <svg className={`${open ? 'block' : 'hidden'}`} width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div id="mobile-menu" className={`lg:hidden overflow-hidden border-t border-white/10 transition-[max-height] duration-300 ${open ? 'max-h-[420px]' : 'max-h-0'}`}>
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
            <div className="grid grid-cols-2 gap-2">
              {primaryTabs.map(tab => <NavLink key={tab.to} to={tab.to} label={tab.label} active={loc.pathname === tab.to} compact />)}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {secondaryTabs.map(tab => (
                <Link key={tab.to} to={tab.to} className={`rounded-full border border-white/10 px-3 py-1.5 text-xs transition ${loc.pathname === tab.to ? 'bg-white/10 text-white' : 'text-gray-300 hover:text-white'}`}>
                  {tab.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </nav>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-outfield/95 backdrop-blur-xl lg:hidden">
        <div className="grid grid-cols-4 gap-1 px-2 py-2">
          {primaryTabs.map(tab => {
            const active = loc.pathname === tab.to
            return (
              <Link
                key={tab.to}
                to={tab.to}
                className={`rounded-xl px-2 py-2 text-center text-[11px] font-medium transition ${active ? 'bg-white text-diamond' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}
              >
                {tab.label}
              </Link>
            )
          })}
        </div>
      </div>
    </>
  )
}
