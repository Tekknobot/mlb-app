import { useEffect, useMemo, useState } from 'react'
import { Api, Team } from '@/services/api'
import TeamCard from '@/components/TeamCard'

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [query, setQuery] = useState('')
  const [leagueFilter, setLeagueFilter] = useState<'all' | 'al' | 'nl'>('all')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    Api.teams()
      .then(p => setTeams(p.data))
      .catch(err => setError(String(err)))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return teams.filter(team => {
      const league = (team.league || '').toLowerCase()
      const leagueOk =
        leagueFilter === 'all' ||
        (leagueFilter === 'al' && league.includes('american')) ||
        (leagueFilter === 'nl' && league.includes('national'))
      const searchOk = !q || `${team.full_name} ${team.location || ''} ${team.division || ''}`.toLowerCase().includes(q)
      return leagueOk && searchOk
    })
  }, [teams, query, leagueFilter])

  return (
    <div className="space-y-5 pb-4">
      <section className="card-panel p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="eyebrow">Teams</div>
            <h1 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">Club directory</h1>
            <p className="mt-2 max-w-2xl text-sm text-gray-300">Browse MLB clubs in a visual team grid with logos, league and division context.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto] xl:min-w-[540px]">
            <input
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search teams..."
              className="input"
            />
            <div className="flex gap-2">
              <button className={`pill ${leagueFilter === 'all' ? '!bg-white !text-diamond' : ''}`} onClick={() => setLeagueFilter('all')}>All</button>
              <button className={`pill ${leagueFilter === 'al' ? '!bg-white !text-diamond' : ''}`} onClick={() => setLeagueFilter('al')}>AL</button>
              <button className={`pill ${leagueFilter === 'nl' ? '!bg-white !text-diamond' : ''}`} onClick={() => setLeagueFilter('nl')}>NL</button>
            </div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="pill">{filtered.length} teams shown</span>
          <span className="pill">{teams.length} total clubs</span>
        </div>
      </section>

      {loading && <div className="card text-center text-gray-300">Loading…</div>}
      {error && <div className="card text-center text-red-300">{error}</div>}

      {!loading && !error && (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map(t => <TeamCard key={t.id} team={t} />)}
        </section>
      )}
    </div>
  )
}
