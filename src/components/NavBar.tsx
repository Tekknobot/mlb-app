import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

const tabs = [
  { to: '/', label: 'Calendar' },
  { to: '/about', label: 'About' },
  { to: '/terms', label: 'Terms' },
  { to: '/privacy', label: 'Privacy' },
] as const

export default function NavBar() {
  const loc = useLocation()
  const [open, setOpen] = useState(false)

  // Close the mobile menu on route change
  useEffect(() => { setOpen(false) }, [loc.pathname])

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <nav className="fixed top-0 inset-x-0 z-50 bg-outfield/95 backdrop-blur border-b border-neutral-800">
      <div className="max-w-2xl mx-auto px-3 h-14 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="font-bold inline-flex items-center gap-2">
          {/* Baseball icon */}
          <svg
            width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true"
            className="shrink-0"
          >
            <circle cx="12" cy="12" r="9" className="stroke-gray-300/90" strokeWidth="1.5" />
            <path d="M6.2 6.2c2.5 2.5 2.5 9.1 0 11.6" className="stroke-seam" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M17.8 6.2c-2.5 2.5-2.5 9.1 0 11.6" className="stroke-seam" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M7.4 8.4l1.6 1.2M7.1 10.5l1.9.7M7.1 13l1.9-.7M7.4 15.2l1.6-1.2" className="stroke-seam/80" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M16.6 8.4l-1.6 1.2M16.9 10.5l-1.9.7M16.9 13l-1.9-.7M16.6 15.2l-1.6-1.2" className="stroke-seam/80" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          SLUGMODE
        </Link>

        {/* Desktop tabs */}
        <ul className="hidden md:flex items-center gap-2 text-sm">
          {tabs.map(t => {
            const active = loc.pathname === t.to
            return (
              <li key={t.to}>
                <Link
                  to={t.to}
                  className={`px-3 py-1.5 rounded-full transition ${
                    active ? 'bg-seam text-chalk' : 'text-gray-200 hover:text-chalk'
                  }`}
                >
                  {t.label}
                </Link>
              </li>
            )
          })}
        </ul>

        {/* Hamburger (mobile only) */}
        <button
          type="button"
          className="md:hidden inline-flex items-center justify-center p-2 rounded-lg border border-neutral-800 text-gray-200 hover:text-chalk hover:bg-neutral-800/60"
          onClick={() => setOpen(o => !o)}
          aria-label="Open navigation menu"
          aria-expanded={open}
          aria-controls="mobile-menu"
        >
          {/* Icon toggles */}
          <svg className={`${open ? 'hidden' : 'block'}`} width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <svg className={`${open ? 'block' : 'hidden'}`} width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <span className="sr-only">Menu</span>
        </button>
      </div>

      {/* Mobile sheet */}
      <div
        id="mobile-menu"
        className={`md:hidden overflow-hidden transition-[max-height] duration-300 ${
          open ? 'max-h-96' : 'max-h-0'
        }`}
      >
        <div className="px-3 pb-3">
          <ul className="flex flex-col gap-2 text-sm">
            {tabs.map(t => {
              const active = loc.pathname === t.to
              return (
                <li key={t.to}>
                  <Link
                    to={t.to}
                    className={`block px-3 py-2 rounded-xl border border-neutral-800 bg-outfield/60 transition ${
                      active ? 'bg-seam text-chalk border-seam' : 'text-gray-200 hover:text-chalk'
                    }`}
                  >
                    {t.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </nav>
  )
}
