import { useEffect, useMemo, useState } from 'react'
import { addDays, format, startOfWeek } from 'date-fns'
import { Api, Game } from '@/services/api'
import GameCard from '@/components/GameCard'
import { ymdInTZ, userTZ } from '@/lib/tz'

type DayBucket = { ymd: string; label: string; games: Game[] }

export default function CalendarPage() {
  const [anchor, setAnchor] = useState(new Date())

  // Mon–Sun week
  const week = useMemo(() => {
    const s = startOfWeek(anchor, { weekStartsOn: 1 })
    return Array.from({ length: 7 }).map((_, i) => addDays(s, i))
  }, [anchor])

  const [loading, setLoading] = useState(false)
  const [buckets, setBuckets] = useState<DayBucket[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setLoading(true); setError(null)

    // Build the 7 local YMDs
    const ymds = week.map(d => format(d, 'yyyy-MM-dd'))
    const dateSet = new Set(ymds)

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
        // ✅ Do NOT filter by postseason; fetch every page for those dates
        const all = await fetchAll({ dates: ymds, per_page: 500 })

        // de-dupe and sort
        const bag = new Map<number, Game>()
        for (const g of all) bag.set(g.id, g)
        const list = Array.from(bag.values()).sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        )

        // Group by local YMD; ensure all 7 buckets exist
        const byDay = new Map<string, Game[]>()
        for (const g of list) {
          const localYmd = ymdInTZ(g.date, userTZ)
          if (!dateSet.has(localYmd)) continue // only this week
          const arr = byDay.get(localYmd) || []
          arr.push(g)
          byDay.set(localYmd, arr)
        }

        const result: DayBucket[] = ymds.map(ymd => ({
          ymd,
          label: format(new Date(`${ymd}T12:00:00`), 'EEE, MMM d'),
          games: byDay.get(ymd) || [],
        }))

        if (!active) return
        setBuckets(result)
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

      {!loading && !error && buckets.every(b => b.games.length === 0) && (
        <div className="text-center text-gray-500">No games this week.</div>
      )}

      <div className="space-y-4">
        {buckets.map(b => (
          <section key={b.ymd} className="space-y-2">
            <div className="text-sm text-gray-400">{b.label}</div>
            {b.games.length === 0 ? (
              <div className="text-gray-500 text-sm">No games.</div>
            ) : (
              <div className="space-y-3">
                {b.games.map(g => <GameCard key={g.id} game={g} />)}
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  )
}
