import { useEffect, useMemo, useState } from 'react'
import { addDays, format, startOfWeek } from 'date-fns'
import { Api, Game } from '@/services/api'
import GameCard from '@/components/GameCard'
import { inRangeInTZ, userTZ } from '@/lib/tz'

export default function CalendarPage() {
  const [anchor, setAnchor] = useState(new Date())
  const week = useMemo(() => {
    const s = startOfWeek(anchor, { weekStartsOn: 1 })
    return Array.from({ length: 7 }).map((_, i) => addDays(s, i))
  }, [anchor])

  const [loading, setLoading] = useState(false)
  const [games, setGames] = useState<Game[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setLoading(true); setError(null)

    const dates = week.map(d => format(d, 'yyyy-MM-dd'))
    const startYmd = dates[0]
    const endYmd = dates[6]

    Api.games({ dates, postseason: true, per_page: 500 })
      .then(res => {
        if (!active) return
        const filtered = (res.data || [])
          .filter(g => inRangeInTZ(g.date, startYmd, endYmd, userTZ))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        setGames(filtered)
      })
      .catch(err => setError(String(err)))
      .finally(() => setLoading(false))

    return () => { active = false }
  }, [week])

  return (
    <div className="pb-20 p-3 max-w-2xl mx-auto">
      <header className="flex items-center justify-between mb-3">
        <button onClick={() => setAnchor(d => addDays(d, -7))} className="pill">Prev</button>
        <div className="font-bold">
          {format(week[0], 'MMM d')} - {format(week[6], 'MMM d, yyyy')}
        </div>
        <button onClick={() => setAnchor(d => addDays(d, 7))} className="pill">Next</button>
      </header>

      {loading && <div className="text-center text-gray-500">Loading games…</div>}
      {error && <div className="text-center text-red-600">{error}</div>}
      {!loading && !error && games.length === 0 && <div className="text-center text-gray-500">No games this week.</div>}

      <div className="space-y-3">
        {games.map(g => (<GameCard key={g.id} game={g} />))}
      </div>
    </div>
  )
}
