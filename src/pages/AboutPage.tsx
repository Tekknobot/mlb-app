import { Link } from 'react-router-dom'

export default function AboutPage() {
  return (
    <div className="space-y-5 pb-4">
      <header className="card-panel p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="eyebrow">About</div>
            <h1 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">About PennantGrid</h1>
            <p className="mt-2 max-w-2xl text-sm text-gray-300">PennantGrid is the redesigned form of this app: a grid-based, mobile-friendly MLB board for schedules, matchups, teams and players.</p>
          </div>
          <Link to="/" className="btn-ghost">Back to dashboard</Link>
        </div>
      </header>

      <section className="card space-y-3">
        <h2 className="section-title">What it includes</h2>
        <ul className="grid gap-3 text-gray-200 sm:grid-cols-2">
          <li className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">Weekly scoreboard dashboard with a grid layout</li>
          <li className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">Daily matchup filtering by date and team</li>
          <li className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">Team logos and club directory cards</li>
          <li className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">Player headshots and core hitting / pitching stats</li>
        </ul>
      </section>

      <section className="card space-y-3">
        <h2 className="section-title">Data source</h2>
        <p className="text-gray-200">
          Game, team, roster and statistical data are retrieved from MLB&apos;s public StatsAPI endpoints.
          No PennantGrid account or third-party sports-data API key is required.
        </p>
        <p className="text-gray-200">
          Team names, player images and related marks remain the property of their respective owners and are shown here for informational purposes only.
          This app is not affiliated with or endorsed by MLB or any club.
        </p>
      </section>
    </div>
  )
}
