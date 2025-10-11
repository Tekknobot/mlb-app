import { useEffect, useMemo, useState } from 'react'
import { addDays, format, startOfWeek } from 'date-fns'
import { Api, Game } from '@/services/api'
import GameCard from '@/components/GameCard'
import { ymdInTZ, inRangeInTZ, userTZ } from '@/lib/tz'

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

    async function load() {
      try {
        // fetch both postseason and regular-season, then merge
        const [post, reg] = await Promise.allSettled([
          Api.games({ dates, postseason: true,  per_page: 500 }),
          Api.games({ dates, postseason: false, per_page: 500 }),
        ])

        const a = post.status === 'fulfilled' ? (post.value.data || []) : []
        const b = reg.status  === 'fulfilled' ? (reg.value.data  || []) : []
        // de-dupe by id
        const bag = new Map<number, Game>()
        for (const g of [...a, ...b]) bag.set(g.id, g)

        // robust local-date filter (inclusive)
        const filtered = Array.from(bag.values())
          .filter(g => {
            const ymdLocal = ymdInTZ(g.date, userTZ)
            return ymdLocal >= startYmd && ymdLocal <= endYmd
          })
          .sort((x, y) => new Date(x.date).getTime() - new Date(y.date).getTime())

        if (!active) return
        setGames(filtered)
      } catch (err: any) {
        if (!active) return
        setError(err?.message || 'Failed to load games')
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
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
