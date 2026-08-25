import { useEffect, useMemo, useState } from 'react'
import { addDays, format, startOfWeek } from 'date-fns'
import { Api, Game } from '@/services/api'
import GameCard from '@/components/GameCard'
import { ymdInTZ, userTZ } from '@/lib/tz'

function fetchAllGames(params: Parameters<typeof Api.games>[0]) {
  return (async () => {
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
  })()
}

export default function CalendarPage() {
  const [anchor, setAnchor] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<'all' | string>('all')
  const [loading, setLoading] = useState(false)
  const [games, setGames] = useState<Game[]>([])
  const [error, setError] = useState<string | null>(null)

  const week = useMemo(() => {
    const s = startOfWeek(anchor, { weekStartsOn: 1 })
    return Array.from({ length: 7 }).map((_, i) => addDays(s, i))
  }, [anchor])

  const weekYMDs = useMemo(() => week.map(d => format(d, 'yyyy-MM-dd')), [week])

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)

    const dateSet = new Set(weekYMDs)
    const fetchStart = addDays(week[0], -1)
    const fetchEnd = addDays(week[6], 1)
    const datesFetch: string[] = []
    for (let d = fetchStart; d <= fetchEnd; d = addDays(d, 1)) {
      datesFetch.push(format(d, 'yyyy-MM-dd'))
    }

    async function load() {
      try {
        const all = await fetchAllGames({ dates: datesFetch, per_page: 500 })
        const bag = new Map<number, Game>()
        for (const g of all) bag.set(g.id, g)
        const filtered = Array.from(bag.values())
          .filter(g => dateSet.has(ymdInTZ(g.date, userTZ)))
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
  }, [week, weekYMDs])

  const byDay = useMemo(() => {
    return weekYMDs.map(ymd => ({
      ymd,
      label: format(new Date(`${ymd}T12:00:00`), 'EEE d'),
      fullLabel: format(new Date(`${ymd}T12:00:00`), 'EEEE, MMM d'),
      games: games.filter(g => ymdInTZ(g.date, userTZ) === ymd),
    }))
  }, [games, weekYMDs])

  const visibleGames = useMemo(() => {
    if (selectedDay === 'all') return games
    return games.filter(g => ymdInTZ(g.date, userTZ) === selectedDay)
  }, [games, selectedDay])

  const totals = useMemo(() => {
    const live = games.filter(g => /live|progress/i.test(g.status || '')).length
    const finals = games.filter(g => /final|completed/i.test(g.status || '')).length
    const teams = new Set(games.flatMap(g => [g.home_team?.id, g.visitor_team?.id].filter(Boolean) as number[])).size
    return { live, finals, teams }
  }, [games])

  return (
    <div className="space-y-5 pb-4">
      <section className="card-panel overflow-hidden">
        <div className="grid gap-6 p-5 lg:grid-cols-[1.25fr_0.9fr] lg:p-6">
          <div>
            <div className="eyebrow">Dashboard</div>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">Slugline</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-300 sm:text-base">
              A grid-first baseball board for weekly schedules, live score tracking, team browsing, and player stats — tuned for desktop and mobile.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="pill">Public MLB data</span>
              <span className="pill">No login required</span>
              <span className="pill">Team logos enabled</span>
            </div>
          </div>
          <div className="stats-grid self-start">
            <div className="metric-card">
              <div className="metric-label">Games</div>
              <div className="metric-value">{games.length}</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Teams</div>
              <div className="metric-value">{totals.teams}</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Live</div>
              <div className="metric-value">{totals.live}</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Final</div>
              <div className="metric-value">{totals.finals}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="card-panel p-4 sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="section-title">Weekly board</div>
            <div className="section-subtitle">{format(week[0], 'MMM d')} – {format(week[6], 'MMM d, yyyy')}</div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setAnchor(d => addDays(d, -7))} className="btn-ghost">Prev week</button>
            <button onClick={() => { setAnchor(new Date()); setSelectedDay('all') }} className="btn-ghost">This week</button>
            <button onClick={() => setAnchor(d => addDays(d, 7))} className="btn">Next week</button>
          </div>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button
            className={`pill whitespace-nowrap ${selectedDay === 'all' ? '!bg-white !text-diamond' : ''}`}
            onClick={() => setSelectedDay('all')}
          >
            All days
          </button>
          {byDay.map(day => (
            <button
              key={day.ymd}
              className={`pill whitespace-nowrap ${selectedDay === day.ymd ? '!bg-white !text-diamond' : ''}`}
              onClick={() => setSelectedDay(day.ymd)}
            >
              {day.label} • {day.games.length}
            </button>
          ))}
        </div>
      </section>

      {loading && <div className="card text-center text-gray-300">Loading games…</div>}
      {error && <div className="card text-center text-red-300">{error}</div>}
      {!loading && !error && games.length === 0 && <div className="card text-center text-gray-300">No games this week.</div>}

      {!loading && !error && selectedDay === 'all' && games.length > 0 && (
        <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {byDay.map(day => (
            <div key={day.ymd} className="card-panel overflow-hidden">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                <div>
                  <div className="font-semibold text-white">{day.fullLabel}</div>
                  <div className="text-xs text-gray-400">{day.games.length} game{day.games.length === 1 ? '' : 's'}</div>
                </div>
                <button className="btn-ghost text-xs" onClick={() => setSelectedDay(day.ymd)}>Focus</button>
              </div>
              <div className="space-y-3 p-4">
                {day.games.length ? day.games.map(g => <GameCard key={g.id} game={g} forceYmd={day.ymd} />) : <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-5 text-center text-sm text-gray-400">No games</div>}
              </div>
            </div>
          ))}
        </section>
      )}

      {!loading && !error && selectedDay !== 'all' && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="section-title">Focused day view</div>
              <div className="section-subtitle">{format(new Date(`${selectedDay}T12:00:00`), 'EEEE, MMM d')}</div>
            </div>
            <button className="btn-ghost" onClick={() => setSelectedDay('all')}>Back to week</button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visibleGames.map(g => <GameCard key={g.id} game={g} forceYmd={selectedDay} />)}
          </div>
          {visibleGames.length === 0 && <div className="card text-center text-gray-300">No games on this day.</div>}
        </section>
      )}
    </div>
  )
}
