import { useEffect, useState } from 'react'
import { Api, Game, Team } from '@/services/api'
import GameCard from '@/components/GameCard'
import { ymdInTZ, userTZ } from '@/lib/tz'
import { format } from 'date-fns'

// Local YYYY-MM-DD for <input type="date">
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
      setLoading(true); setError(null)
      try {
        // 1) Preferred: dates[] (some backends honor this)
        const res1 = await Api.games({ dates: date, postseason: true, per_page: 500 })
        let list: Game[] = (res1.data || []).filter(g => ymdInTZ(g.date, userTZ) === date)

        // 2) Fallback: start_date/end_date (some backends only honor this)
        if (list.length === 0) {
          const res2 = await Api.games({ start_date: date, end_date: date, postseason: true, per_page: 500 })
          list = (res2.data || []).filter(g => ymdInTZ(g.date, userTZ) === date)
        }

        // 3) Sort chronologically
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

  const filtered = filterTeam === 'all'
    ? games
    : games.filter(g => g.home_team.id === filterTeam || g.visitor_team?.id === filterTeam)

  return (
    <div className="pb-20 p-3 max-w-2xl mx-auto">
      <header className="mb-3 space-y-2">
        <div className="font-bold">Matchups</div>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="input"
        />
        <select
          value={filterTeam}
          onChange={e => setFilterTeam(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          className="input"
        >
          <option value="all">All teams</option>
          {teams.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
        </select>
      </header>

      {loading && <div className="text-center text-gray-400">Loading…</div>}
      {error && <div className="text-center text-seam">{error}</div>}

      {!loading && !error && filtered.length === 0 && (
        <div className="text-center text-gray-400">No games on this date.</div>
      )}

      <div className="space-y-3">
        {filtered.map(g => (<GameCard key={g.id} game={g} forceYmd={date} />))}
      </div>
    </div>
  )
}
