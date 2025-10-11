import { useEffect, useMemo, useState } from 'react'
import { addDays, format, startOfWeek } from 'date-fns'
import { Api, Game } from '@/services/api'
import GameCard from '@/components/GameCard'
import { ymdInTZ, userTZ } from '@/lib/tz'

export default function CalendarPage() {
  const [anchor, setAnchor] = useState(new Date())

  // Mon–Sun week
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

    // Build the 7 local YMDs (strings) for the exact week
    const weekYMDs = week.map(d => format(d, 'yyyy-MM-dd'))
    const dateSet = new Set(weekYMDs) // exact membership check

    // Build a ±1 day fetch window to catch UTC spills
    const fetchStart = addDays(week[0], -1)
    const fetchEnd   = addDays(week[6],  1)
    const datesFetch: string[] = []
    for (let d = fetchStart; d <= fetchEnd; d = addDays(d, 1)) {
      datesFetch.push(format(d, 'yyyy-MM-dd'))
    }

    async function fetchAll(params: Parameters<typeof Api.games>[0]) {
      const out: Game[] = []
      let cursor: string | number | undefined
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
        // ✅ No postseason filter; fetch every page for the buffered dates
        const all = await fetchAll({ dates: datesFetch, per_page: 500 })

        // de-dupe by id
        const bag = new Map<number, Game>()
        for (const g of all) bag.set(g.id, g)

        // ✅ Keep a game iff its LOCAL YMD is one of the 7 week days
        const filtered = Array.from(bag.values())
          .filter(g => dateSet.has( ymdInTZ(g.date, userTZ) ))
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
