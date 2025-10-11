import { useEffect, useMemo, useState } from 'react'
import { addDays, format, startOfWeek } from 'date-fns'
import { Api, Game } from '@/services/api'
import GameCard from '@/components/GameCard'
import { ymdInTZ, userTZ } from '@/lib/tz'

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

    async function fetchAll(params: Parameters<typeof Api.games>[0]) {
      const out: Game[] = []
      let cursor: string | number | undefined = undefined
      for (let i = 0; i < 20; i++) {
        const res = await Api.games({ ...params, cursor })
        out.push(...(res.data || []))
        const next = res.meta?.next_cursor
        if (!next) break
        cursor = next
      }
      return out
    }

    async function load() {
      try {
        // ✅ single query WITHOUT 'postseason' filter; paginate all cursors
        const all = await fetchAll({ dates, per_page: 500 })

        // de-dupe just in case
        const bag = new Map<number, Game>()
        for (const g of all) bag.set(g.id, g)

        // ✅ inclusive filter by LOCAL YMD so the 7th day is not lost to UTC shifts
        const filtered = Array.from(bag.values())
          .filter(g => {
            const ymdLocal = ymdInTZ(g.date, userTZ)
            return ymdLocal >= startYmd && ymdLocal <= endYmd
          })
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

        if (!active) return
        setGames(filtered)
      } catch (e: any) {
        if (!active) return
        setError(e?.message || 'Failed to load games')
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
