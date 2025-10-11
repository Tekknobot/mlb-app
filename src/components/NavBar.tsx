import { Link, useLocation } from 'react-router-dom'

const tabs = [
  { to: '/', label: 'Calendar' },
  { to: '/about', label: 'About' },
  { to: '/terms', label: 'Terms' },
  { to: '/privacy', label: 'Privacy' },
] as const

export default function NavBar() {
  const loc = useLocation()
  return (
    <nav className="fixed top-0 inset-x-0 z-50 bg-outfield/95 backdrop-blur border-b border-neutral-800">
      <div className="max-w-2xl mx-auto px-3 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="font-bold inline-flex items-center gap-2">
            {/* Baseball icon */}
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              className="shrink-0"
            >
              {/* ball outline */}
              <circle cx="12" cy="12" r="9" className="stroke-gray-300/90" strokeWidth="1.5" />
              {/* left seam */}
              <path
                d="M6.2 6.2c2.5 2.5 2.5 9.1 0 11.6"
                className="stroke-seam"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              {/* right seam */}
              <path
                d="M17.8 6.2c-2.5 2.5-2.5 9.1 0 11.6"
                className="stroke-seam"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              {/* stitch ticks (subtle) */}
              <path
                d="M7.4 8.4l1.6 1.2M7.1 10.5l1.9.7M7.1 13l1.9-.7M7.4 15.2l1.6-1.2"
                className="stroke-seam/80"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
              <path
                d="M16.6 8.4l-1.6 1.2M16.9 10.5l-1.9.7M16.9 13l-1.9-.7M16.6 15.2l-1.6-1.2"
                className="stroke-seam/80"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            </svg>
            {/* App short name */}
            SLUGMODE
          </Link>

          <ul className="flex items-center gap-2 text-sm">
            {tabs.map(t => {
              const active = loc.pathname === t.to
              return (
                <li key={t.to}>
                  <Link
                    to={t.to}
                    className={`px-3 py-1.5 rounded-full transition ${
                      active ? 'bg-seam text-chalk' : 'text-gray-200'
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
