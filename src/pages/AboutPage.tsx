import { Link } from 'react-router-dom'

export default function AboutPage() {
  return (
    <div className="p-3 max-w-2xl mx-auto space-y-3 pb-20">
      <header className="flex items-center justify-between">
        <h1 className="font-semibold">About</h1>
        <Link to="/" className="btn-ghost">Back</Link>
      </header>

      <section className="card space-y-2">
        <p>
          SLUGMODE is a lightweight baseball scoreboard and
          game browser. It pulls fixtures and results, summarizes recent form,
          and gives you a clean, mobile-friendly way to follow matchups.
        </p>
        <div className="hr-seam" />
        <ul className="list-disc pl-6 space-y-1 text-gray-200">
          <li>Fast calendar view of upcoming and recent games</li>
          <li>Compact game cards with status and scores</li>
          <li>Color-coded team abbreviation pills</li>
          <li>Simple, dark, accessible UI</li>
        </ul>
      </section>

      <section className="card space-y-2">
        <h2 className="font-semibold">Attribution</h2>
        <p className="text-gray-200">
          Team names and related marks are trademarks of their respective owners
          and are used here for informational purposes only. This app is not
          affiliated with or endorsed by any league or team.
        </p>
      </section>
    </div>
  )
}
