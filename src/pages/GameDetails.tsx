// src/pages/GameDetails.tsx

import { useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { Api, Game, Team } from '@/services/api'
import { gamesForTeamSmart, gamesInWindowFilterLocal } from '@/services/api'
import { format, subDays, eachDayOfInterval } from 'date-fns'
import { ymdInTZ, userTZ } from '@/lib/tz'

// ----------------------- debug toggles -----------------------
const DEBUG = import.meta.env.VITE_DEBUG === '1'

function useDebug(tag = 'GameDetails') {
  const [lines, setLines] = useState<string[]>([])
  const log = (...args: any[]) => {
    const msg = args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ')
    if (DEBUG) console.debug(`[${tag}]`, ...args)
    setLines(prev => [...prev, `[${new Date().toISOString()}] ${msg}`].slice(-300))
  }
  const clear = () => setLines([])
  return { lines, log, clear, enabled: DEBUG }
}

// ----------------------- normalization helpers -----------------------
type AnyRec = Record<string, any>
type AnyGame = Game & AnyRec

const toNum = (v: any): number | undefined => {
  if (v == null || v === '') return undefined
  const n = Number(v); return Number.isFinite(n) ? n : undefined
}

const get = (o: AnyRec, path: string) =>
  path.split('.').reduce((a, k) => (a == null ? undefined : a[k]), o)

const firstNum = (o: AnyRec, paths: string[]) => {
  for (const p of paths) {
    const v = p.includes('.') ? get(o, p) : (o as any)[p]
    const n = toNum(v); if (n !== undefined) return n
  }
  return undefined
}
const firstVal = (o: AnyRec, paths: string[]) => {
  for (const p of paths) {
    const v = p.includes('.') ? get(o, p) : (o as any)[p]
    if (v != null && v !== '') return v
  }
  return undefined
}

function normalizeGame(rawIn: AnyGame): Game {
  const raw = rawIn || ({} as AnyGame)

  const visitor_team =
    firstVal(raw, ['visitor_team', 'away_team', 'away', 'visitor']) ?? null
  const home_team =
    firstVal(raw, ['home_team', 'home', 'homeTeam']) ?? null

  // Official BDL-MLB payload puts runs here:
  //   home_team_data.runs / away_team_data.runs
  const visitor_team_score =
    firstNum(raw, [
      'visitor_team_score',
      'away_team_data.runs',
      'away_team_score',
      'away_score',
      'score_away',
    ]) ?? null

  const home_team_score =
    firstNum(raw, [
      'home_team_score',
      'home_team_data.runs',
      'home_score',
      'score_home',
    ]) ?? null

  const date = firstVal(raw, ['date', 'game_date', 'start_time', 'datetime']) ?? ''
  const status = firstVal(raw, ['status', 'game_status', 'state']) ?? ''

  return {
    ...raw,
    visitor_team: visitor_team,
    home_team: home_team,
    visitor_team_score,
    home_team_score,
    date,
    status,
  } as Game
}

// ----------------------- tiny util (display-only) -----------------------
type LoadState<T> = { loading: boolean; error: string | null; data: T }

const abbr = (t?: Team | null) =>
  t?.abbreviation ||
  (t?.display_name
    ? t.display_name.split(' ').map(s => s[0]).join('').slice(0, 3).toUpperCase()
    : '—')

const fmtYMD = (d: Date) => format(d, 'yyyy-MM-dd')
const labelFromYMD = (ymd: string) => format(new Date(`${ymd}T12:00:00`), 'MMM d')

// ----------------------- form helpers -----------------------
type Form = { wins: number; losses: number; runsFor: number; runsAgainst: number; streak: string; last5: string }

function computeForm(games: Game[], teamId: number): Form {
  let wins = 0, losses = 0, runsFor = 0, runsAgainst = 0
  const results: ('W'|'L')[] = []
  for (const g of games) {
    if (g.home_team_score == null || g.visitor_team_score == null) continue
    const isHome = g.home_team?.id === teamId
    const us = isHome ? (g.home_team_score ?? 0) : (g.visitor_team_score ?? 0)
    const them = isHome ? (g.visitor_team_score ?? 0) : (g.home_team_score ?? 0)
    runsFor += us; runsAgainst += them
    if (us > them) { wins++; results.push('W') } else { losses++; results.push('L') }
  }
  let streakCount = 0; let streakType: 'W'|'L'|null = null
  for (let i = results.length - 1; i >= 0; i--) {
    if (i === results.length - 1) { streakType = results[i]; streakCount = 1; continue }
    if (results[i] === streakType) streakCount++; else break
  }
  const streak = results.length ? `${streakType}${streakCount}` : '—'
  const last5 = results.slice(-5).join(' ')
  return { wins, losses, runsFor, runsAgainst, streak, last5 }
}

// ----------------------- probability helpers -----------------------
const clamp01 = (x: number) => Math.max(0, Math.min(1, x))
const sigmoid = (z: number) => 1 / (1 + Math.exp(-z))
const pct = (p: number) => `${Math.round(p * 100)}%`

/**
 * Heuristic win probability model (home team) using ONLY:
 * - recent winrate delta (home minus away)
 * - run differential per game delta
 * - small home field edge
 */
function calcHomeWinProb(
  homeForm?: Form | null,
  awayForm?: Form | null
): number | null {
  if (!homeForm || !awayForm) return null

  const hg = homeForm.wins + homeForm.losses
  const ag = awayForm.wins + awayForm.losses
  const wrHome = hg > 0 ? homeForm.wins / hg : 0.5
  const wrAway = ag > 0 ? awayForm.wins / ag : 0.5
  const rdpgHome = hg > 0 ? (homeForm.runsFor - homeForm.runsAgainst) / hg : 0
  const rdpgAway = ag > 0 ? (awayForm.runsFor - awayForm.runsAgainst) / ag : 0

  // weights (heuristic)
  const wWinRate = 2.0
  const wRunDiff = 0.08
  const homeEdge = 0.25 // base home advantage

  const z =
    homeEdge +
    wWinRate * (wrHome - wrAway) +
    wRunDiff * (rdpgHome - rdpgAway)

  return clamp01(sigmoid(z))
}

// Simple percentage bar
function ProbBar({ label, p, tint }: { label: string; p: number; tint: 'home' | 'away' }) {
  const pctNum = Math.round(p * 100)
  const trackStyle: React.CSSProperties = {
    width: '100%',
    height: '8px',
    borderRadius: '9999px',
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  }
  const fillStyle: React.CSSProperties = {
    width: `${pctNum}%`,
    height: '100%',
    borderRadius: '9999px',
    backgroundColor: tint === 'home' ? '#16a34a' /* green-600 */ : '#ef4444' /* red-500 */,
    transition: 'width 300ms ease',
  }
  return (
    <div className="w-full">
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-gray-300">{label}</span>
        <span className="font-semibold">{pctNum}%</span>
      </div>
      <div style={trackStyle} aria-label={`${label} win probability ${pctNum}%`}>
        <div style={fillStyle} />
      </div>
    </div>
  )
}

// ----------------------- status coloring -----------------------
function statusClasses(status?: string) {
  const s = (status || 'Scheduled').toString().toLowerCase()
  if (['in progress', 'live', 'ongoing'].some(k => s.includes(k))) {
    return 'bg-sky-600 text-white animate-pulse'
  }
  if (['final', 'completed', 'ended'].some(k => s.includes(k))) {
    return 'bg-emerald-600 text-white'
  }
  if (['postponed', 'delayed'].some(k => s.includes(k))) {
    return 'bg-amber-500 text-black'
  }
  if (['suspended'].some(k => s.includes(k))) {
    return 'bg-orange-600 text-white'
  }
  if (['cancelled', 'canceled'].some(k => s.includes(k))) {
    return 'bg-red-600 text-white'
  }
  // default (scheduled / pre-game)
  return 'bg-slate-700 text-slate-100'
}

function StatusPill({ status }: { status?: string }) {
  return <span className={`pill ${statusClasses(status)}`}>Status: {status || 'Scheduled'}</span>
}

// ----------------------- robust game finder -----------------------
async function loadGameSmart(
  id: string | number | null,
  selectedYmd: string,
  homeId?: number,
  awayId?: number,
  log: (msg: string, data?: any) => void = () => {}
): Promise<Game | null> {
  log('loadGameSmart:start', { id, selectedYmd, homeId, awayId })

  const targetIdStr = id != null ? String(id) : null
  const targetDate = new Date(`${selectedYmd}T12:00:00`)

  const ymd = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
      date.getDate()
    ).padStart(2, '0')}`

  const daysDiff = (aISO: string, b: Date) =>
    Math.abs(Math.round((+new Date(aISO) - +b) / 86400000))

  const hasScores = (g: Game) => g.home_team_score != null && g.visitor_team_score != null

  const bothTeamsMatch = (g: Game, a?: number, b?: number) => {
    if (!a || !b) return false
    const h = g.home_team?.id
    const v = g.visitor_team?.id
    return (h === a && v === b) || (h === b && v === a)
  }

  const score = (g: Game): number => {
    let s = 0
    if (targetIdStr && String(g.id) === targetIdStr) s += 1000
    if (ymd(new Date(g.date)) === ymd(targetDate)) s += 200
    if (homeId && awayId && bothTeamsMatch(g, homeId, awayId)) s += 300
    else {
      if (homeId && (g.home_team?.id === homeId || g.visitor_team?.id === homeId)) s += 60
      if (awayId && (g.home_team?.id === awayId || g.visitor_team?.id === awayId)) s += 60
    }
    s += Math.max(0, 100 - 10 * Math.min(9, daysDiff(g.date, targetDate)))
    if (hasScores(g)) s += 30
    if (g.status && g.status !== 'Scheduled') s += 10
    return s
  }

  const fetchGames = async (params: Record<string, any>) => {
    const res = await Api.games(params as any)
    const list = (res?.data ?? res ?? []) as AnyGame[]
    return list.map(normalizeGame)
  }

  async function fetchDateExact(): Promise<Game[]> {
    const list = await fetchGames({ dates: [selectedYmd], per_page: 500 })
    return list
  }

  async function fetchDateWindow(days: number): Promise<Game[]> {
    const end = new Date(`${selectedYmd}T12:00:00`)
    const start = new Date(end); start.setDate(start.getDate() - days)
    const daysArr = eachDayOfInterval({ start, end }).map(d => ymd(d))
    const list = await fetchGames({ dates: daysArr, per_page: 500 })
    return list
  }

  async function fetchTeamWindow(days: number): Promise<Game[]> {
    if (!homeId && !awayId) return []
    const end = new Date(`${selectedYmd}T12:00:00`)
    const start = new Date(end); start.setDate(start.getDate() - days)
    const daysArr = eachDayOfInterval({ start, end }).map(d => ymd(d))
    const ids = [homeId, awayId].filter(Boolean) as number[]
    const list = await fetchGames({ dates: daysArr, team_ids: ids, per_page: 500 })
    return list
  }

  async function fetchSeasonSweep(): Promise<Game[]> {
    const season = new Date(`${selectedYmd}T12:00:00`).getFullYear()
    const ids = [homeId, awayId].filter(Boolean) as number[]
    const list = await fetchGames({ seasons: [season], team_ids: ids, per_page: 500 })
    return list
  }

  const bag = new Map<number, Game>()

  if (id != null && !Number.isNaN(Number(id)) && Api.game) {
    try {
      const g = await Api.game(Number(id))
      if ((g as any)?.id != null) {
        const n = normalizeGame(g as AnyGame)
        bag.set(n.id, n)
      }
    } catch {}
  }

  for (const step of [
    ['exact', fetchDateExact],
    ['window3', () => fetchDateWindow(3)],
    ['team14', () => fetchTeamWindow(14)],
    ['season', fetchSeasonSweep],
  ] as const) {
    try {
      const list = await step[1]()
      for (const g of list) if (!bag.has(g.id)) bag.set(g.id, g)
    } catch {}
  }

  const candidates = Array.from(bag.values())
  if (!candidates.length) return null

  const scored = candidates.map(g => ({ g, s: score(g) })).sort((a, b) => b.s - a.s)
  return scored[0].g
}

// ----------------------- small UI bits -----------------------
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card">
      <div className="mb-2 font-semibold">{title}</div>
      {children}
    </section>
  )
}
function Pill({ children }: { children: React.ReactNode }) {
  return <span className="pill">{children}</span>
}
function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-300">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  )
}

// ----------------------- page -----------------------
export default function GameDetailsPage() {
  const { id } = useParams()
  const [sp] = useSearchParams()
  const selectedYmd = sp.get('date') || format(new Date(), 'yyyy-MM-dd')
  const homeId = Number(sp.get('homeId') || 0)
  const awayId = Number(sp.get('awayId') || 0)

  const [game, setGame] = useState<LoadState<Game | null>>({ loading: true, error: null, data: null })
  const [home, setHome] = useState<LoadState<Team | null>>({ loading: true, error: null, data: null })
  const [away, setAway] = useState<LoadState<Team | null>>({ loading: true, error: null, data: null })
  const [recentHome, setRecentHome] = useState<LoadState<Game[]>>({ loading: true, error: null, data: [] })
  const [recentAway, setRecentAway] = useState<LoadState<Game[]>>({ loading: true, error: null, data: [] })

  const { lines, log, clear, enabled } = useDebug()

  // Load the core game
  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const g = await loadGameSmart(id ?? null, selectedYmd, homeId || undefined, awayId || undefined, log)
        if (!alive) return
        if (!g) {
          setGame({
            loading: false,
            error: `No game matched (id=${id}, date=${selectedYmd}, homeId=${homeId}, awayId=${awayId}).`,
            data: null
          })
        } else {
          setGame({ loading: false, error: null, data: g })
        }
      } catch (e: any) {
        if (!alive) return
        setGame({ loading: false, error: e?.message || 'Failed to load game', data: null })
      }
    })()
    return () => { alive = false }
  }, [id, selectedYmd, homeId, awayId])

  // Load home/away team details (no player hydration; no head-to-head)
  useEffect(() => {
    let alive = true
    async function loadTeam(teamId: number, setTeam: any) {
      try {
        const t = Api.team ? await Api.team(teamId) : null
        if (!alive) return
        setTeam({ loading: false, error: null, data: t })
      } catch (e: any) {
        if (!alive) return
        setTeam({ loading: false, error: e?.message || 'Failed to load team', data: null })
      }
    }
    if (homeId) loadTeam(homeId, setHome)
    if (awayId) loadTeam(awayId, setAway)
    return () => { alive = false }
  }, [homeId, awayId])

  // Recent form only
  useEffect(() => {
    let alive = true
    const end = new Date(`${selectedYmd}T12:00:00`)
    const start14 = subDays(end, 14)
    const start30 = subDays(end, 30)

    async function run() {
      try {
        if (homeId) {
          let homeGames = (await gamesForTeamSmart(homeId, fmtYMD(start14), fmtYMD(end))).map(g => normalizeGame(g as AnyGame))
          if (homeGames.length < 3) {
            homeGames = (await gamesInWindowFilterLocal(fmtYMD(start30), fmtYMD(end), [homeId])).map(g => normalizeGame(g as AnyGame))
          }
          if (alive) setRecentHome({ loading: false, error: null, data: homeGames })
        }

        if (awayId) {
          let awayGames = (await gamesForTeamSmart(awayId, fmtYMD(start14), fmtYMD(end))).map(g => normalizeGame(g as AnyGame))
          if (awayGames.length < 3) {
            awayGames = (await gamesInWindowFilterLocal(fmtYMD(start30), fmtYMD(end), [awayId])).map(g => normalizeGame(g as AnyGame))
          }
          if (alive) setRecentAway({ loading: false, error: null, data: awayGames })
        }
      } catch {}
    }
    run()
    return () => { alive = false }
  }, [homeId, awayId, selectedYmd])

  const title = useMemo(() => {
    const d = format(new Date(`${selectedYmd}T12:00:00`), 'EEE, MMM d')
    return `${d} — Game Details`
  }, [selectedYmd])

  // Derived summaries
  const homeForm = useMemo(() => (home.data ? computeForm(recentHome.data, home.data.id) : null), [recentHome.data, home.data])
  const awayForm = useMemo(() => (away.data ? computeForm(recentAway.data, away.data.id) : null), [recentAway.data, away.data])

  const winProbHome = useMemo(() => {
    return calcHomeWinProb(homeForm, awayForm)
  }, [homeForm, awayForm])

  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="font-semibold">{title}</h1>
        <Link to="/" className="btn-ghost">Back</Link>
      </div>

      {/* Matchup header */}
      <Section title="Matchup">
        {game.loading && <div className="text-gray-400">Loading game…</div>}
        {!game.loading && game.error && <div className="text-seam text-sm">{game.error}</div>}
        {!game.loading && !game.data && !game.error && <div className="text-gray-400">Game not found.</div>}
        {game.data && (
          (() => {
            const gd = { ...game.data, visitor_team: game.data.visitor_team ?? (game.data as any).away_team }
            const awayProb = winProbHome != null ? 1 - winProbHome : null
            return (
              <>
                <div className="grid grid-cols-2 gap-3 items-center">
                  <div className="text-right">
                    <div className="text-sm text-gray-400">Away ({abbr(gd.visitor_team)})</div>
                    <div className="font-bold">{gd.visitor_team?.full_name || gd.visitor_team?.display_name}</div>
                    <div className="text-2xl font-bold">{gd.visitor_team_score ?? ''}</div>
                  </div>
                  <div className="text-left">
                    <div className="text-sm text-gray-400">Home ({abbr(gd.home_team)})</div>
                    <div className="font-bold">{gd.home_team?.full_name || gd.home_team?.display_name}</div>
                    <div className="text-2xl font-bold">{gd.home_team_score ?? ''}</div>
                  </div>
                </div>

                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  {/* colored status */}
                  <StatusPill status={gd.status} />
                  {winProbHome != null && (
                    <>
                      {/* Away FIRST */}
                      <Pill>Away win prob: {pct(awayProb!)}</Pill>
                      <Pill>Home win prob: {pct(winProbHome)}</Pill>
                    </>
                  )}
                </div>

                {winProbHome != null && (
                  // Away FIRST
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <ProbBar label="Away" p={awayProb!} tint="away" />
                    <ProbBar label="Home" p={winProbHome} tint="home" />
                  </div>
                )}
              </>
            )
          })()
        )}
      </Section>

      {/* Recent form summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Section title={`Recent form — Home (${abbr(home.data)}) last 14–30d`}>
          {homeForm ? (
            <div className="space-y-2">
              <StatRow label="Record" value={`${homeForm.wins}-${homeForm.losses}`} />
              <StatRow label="Streak" value={homeForm.streak} />
              <StatRow label="Run diff" value={`${homeForm.runsFor - homeForm.runsAgainst >= 0 ? '+' : ''}${homeForm.runsFor - homeForm.runsAgainst}`} />
              <StatRow label="Last 5" value={homeForm.last5 || '—'} />
              <div className="hr-seam" />
              <TinyGamesList games={recentHome.data} focusTeamId={homeId} />
            </div>
          ) : <div className="text-gray-400">Loading…</div>}
        </Section>

        <Section title={`Recent form — Away (${abbr(away.data)}) last 14–30d`}>
          {awayForm ? (
            <div className="space-y-2">
              <StatRow label="Record" value={`${awayForm.wins}-${awayForm.losses}`} />
              <StatRow label="Streak" value={awayForm.streak} />
              <StatRow label="Run diff" value={`${awayForm.runsFor - awayForm.runsAgainst >= 0 ? '+' : ''}${awayForm.runsFor - awayForm.runsAgainst}`} />
              <StatRow label="Last 5" value={awayForm.last5 || '—'} /> {/* ✅ added */}
              <div className="hr-seam" />
              <TinyGamesList games={recentAway.data} focusTeamId={awayId} />
            </div>
          ) : <div className="text-gray-400">Loading…</div>}
        </Section>
      </div>
    </div>
  )
}

// ----------------------- tiny lists -----------------------
function TinyGamesList({ games, focusTeamId }: { games: Game[]; focusTeamId?: number }) {
  if (!games?.length) return <div className="text-gray-400">No recent games.</div>
  const sorted = [...games]
    .filter(g => g.home_team_score != null && g.visitor_team_score != null)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10)

  return (
    <ul className="space-y-1.5">
      {sorted.map(g => {
        const ymd = ymdInTZ(g.date, userTZ)
        const day = labelFromYMD(ymd)
        const isHome = focusTeamId ? g.home_team?.id === focusTeamId : false
        const us = isHome ? (g.home_team_score ?? 0) : (g.visitor_team_score ?? 0)
        const them = isHome ? (g.visitor_team_score ?? 0) : (g.home_team_score ?? 0)
        const wl = us > them ? 'W' : 'L'
        const homeAb = abbr(g.home_team)
        const awayAb = abbr(g.visitor_team)

        return (
          <li key={g.id} className="flex items-center justify-between text-sm">
            <span className="text-gray-300 w-16 shrink-0">{day}</span>
            <span className="truncate text-gray-100 mx-2">
              {awayAb} {g.visitor_team_score ?? ''} — {homeAb} {g.home_team_score ?? ''}
            </span>
            <span className={`font-semibold w-8 text-right ${wl === 'W' ? 'text-ivy' : 'text-seam'}`}>{wl}</span>
          </li>
        )
      })}
    </ul>
  )
}
