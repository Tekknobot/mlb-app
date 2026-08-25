import { useEffect, useMemo, useState } from 'react'
import { Api, Game, Team } from '@/services/api'
import GameCard from '@/components/GameCard'
import { ymdInTZ, userTZ } from '@/lib/tz'
import { format } from 'date-fns'

const todayLocal = () => format(new Date(), 'yyyy-MM-dd')

export default function MatchupsPage() {
  const [date, setDate] = useState<string>(() => todayLocal())
  const [games, setGames] = useState<Game[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [filterTeam, setFilterTeam] = useState<number | 'all'>('all')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Api.teams().then(p => setTeams(p.data)).catch(() => {})
  }, [])

  useEffect(() => {
    let alive = true
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res1 = await Api.games({ dates: date, postseason: true, per_page: 500 })
        let list: Game[] = (res1.data || []).filter(g => ymdInTZ(g.date, userTZ) === date)
        if (list.length === 0) {
          const res2 = await Api.games({ start_date: date, end_date: date, postseason: true, per_page: 500 })
          list = (res2.data || []).filter(g => ymdInTZ(g.date, userTZ) === date)
        }
        list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        if (alive) setGames(list)
      } catch (e: any) {
        if (alive) setError(String(e?.message || e))
      } finally {
        if (alive) setLoading(false)
      }
    }
    load()
    return () => { alive = false }
  }, [date])

  const filtered = useMemo(() => (
    filterTeam === 'all'
      ? games
      : games.filter(g => g.home_team.id === filterTeam || g.visitor_team?.id === filterTeam)
  ), [games, filterTeam])

  return (
    <div className="space-y-5 pb-4">
      <section className="card-panel p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="eyebrow">Matchups</div>
            <h1 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">Daily matchup grid</h1>
            <p className="mt-2 max-w-2xl text-sm text-gray-300">Filter the board by date and club to zero in on exactly the games you want to track.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[520px]">
            <label className="block">
              <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">Date</div>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input" />
            </label>
            <label className="block">
              <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">Team filter</div>
              <select value={filterTeam} onChange={e => setFilterTeam(e.target.value === 'all' ? 'all' : Number(e.target.value))} className="input">
                <option value="all">All teams</option>
                {teams.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
              </select>
            </label>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="pill">{filtered.length} visible game{filtered.length === 1 ? '' : 's'}</span>
          <span className="pill">{teams.length} teams loaded</span>
        </div>
      </section>

      {loading && <div className="card text-center text-gray-300">Loading…</div>}
      {error && <div className="card text-center text-red-300">{error}</div>}
      {!loading && !error && filtered.length === 0 && <div className="card text-center text-gray-300">No games on this date.</div>}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map(g => <GameCard key={g.id} game={g} forceYmd={date} />)}
      </section>
    </div>
  )
}
