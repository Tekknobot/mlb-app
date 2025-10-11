// src/services/api.ts — Ball Don't Lie (MLB) client (corrected)

/**
 * Defaults to the MLB namespace.
 * Override with VITE_API_BASE_URL if you need a custom base.
 *
 * Dev tip: set your Vite proxy so that /api -> https://api.balldontlie.io/mlb/v1
 */
const BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  (import.meta.env.DEV ? '/api' : 'https://api.balldontlie.io/mlb/v1')

const API_KEY = import.meta.env.VITE_BALLDONTLIE_API_KEY as string | undefined

type FetchOptions = RequestInit & { signal?: AbortSignal }

// -----------------------------
// Small helpers
// -----------------------------

// Convert MLB-style innings string/number to decimal innings (e.g. "12.2" => 12 + 2/3)
function inningsToDecimal(ip: any): number | undefined {
  if (ip == null || ip === '') return undefined
  const s = String(ip)
  if (!s.includes('.')) return Number.isFinite(Number(s)) ? Number(s) : undefined
  const [whole, frac] = s.split('.')
  const w = Number(whole)
  if (!Number.isFinite(w)) return undefined
  const f = frac === '1' ? 1 / 3 : frac === '2' ? 2 / 3 : 0
  return w + f
}

function addTo<T extends Record<string, number>, K extends keyof T>(
  acc: T,
  key: K,
  val?: number
): void {
  if (val == null || !Number.isFinite(val)) return
  const cur = (acc[key] as number | undefined) ?? 0
  acc[key] = (cur + val) as T[K]
}

function pickNum(obj: any, paths: string[]): number | undefined {
  for (const p of paths) {
    const v = pick<any>(obj, [p])
    if (v == null || v === '') continue
    const n = Number(v)
    if (Number.isFinite(n)) return n
  }
  return undefined
}

async function collectAllCursor<T>(
  fn: (cursor?: number | string) => Promise<Paginated<T>>
): Promise<T[]> {
  const out: T[] = []
  let cursor: number | string | undefined
  for (let i = 0; i < 20; i++) {
    const page = await fn(cursor)
    out.push(...(page.data || []))
    const next = page.meta?.next_cursor
    if (!next) break
    cursor = next
  }
  return out
}

// -----------------------------
// Utilities
// -----------------------------

const dayKey = (iso: string) => (iso ?? '').slice(0, 10)

function inRangeDateOnly(iso: string, startISO: string, endISO: string) {
  const d = dayKey(iso)
  return d >= dayKey(startISO) && d <= dayKey(endISO)
}

function addDays(ymd: string, n: number) {
  const d = new Date(`${ymd}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

function eachDay(startYmd: string, endYmd: string): string[] {
  const out: string[] = []
  let cur = startYmd
  while (cur <= endYmd) {
    out.push(cur)
    cur = addDays(cur, 1)
  }
  return out
}

// -----------------------------
// Low-level fetch with auth + debug
// -----------------------------
async function apiFetch<T>(path: string, opts: FetchOptions = {}): Promise<T> {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), 20000)

  const DEBUG = import.meta.env.VITE_DEBUG === '1'
  const url = `${BASE_URL}${path}`
  const headers: Record<string, string> = { ...(opts.headers as any) }
  if (API_KEY) headers['Authorization'] = API_KEY

  if (DEBUG) console.debug('[apiFetch:request]', { url, hasAuth: !!API_KEY })

  try {
    const res = await fetch(url, {
      ...opts,
      headers,
      signal: opts.signal ?? controller.signal,
    })

    if (DEBUG) console.debug('[apiFetch:response]', res.status, url)

    const text = await res.text()
    if (!res.ok) {
      console.error('[apiFetch:error]', res.status, url, text?.slice(0, 500))
      throw new Error(`HTTP ${res.status} ${res.statusText} :: ${text?.slice(0, 200)}`)
    }

    try {
      return JSON.parse(text) as T
    } catch {
      console.error('[apiFetch:parse]', url, text?.slice(0, 500))
      throw new Error('Failed to parse JSON')
    }
  } finally {
    clearTimeout(id)
  }
}

// -----------------------------
// Types (UI-friendly shapes)
// -----------------------------

export interface Team {
  id: number
  display_name: string
  abbreviation?: string
  league?: string
  division?: string
  location?: string
  get full_name(): string
}

export interface Player {
  id: number
  first_name: string
  last_name: string
  full_name?: string
  position?: string
  team?: Team

  // MLB stat surface
  avg?: number | string
  hr?: number
  rbi?: number

  era?: number
  so?: number
  whip?: number
}

export interface Game {
  id: number
  date: string
  home_team: Team
  away_team?: Team
  visitor_team?: Team

  home_team_score?: number
  away_team_score?: number
  visitor_team_score?: number

  season?: number
  status?: string
}

export interface Paginated<T> {
  data: T[]
  meta?: { next_cursor?: number | string; per_page?: number }
}

// -----------------------------
// Normalizers
// -----------------------------

function pick<T = any>(obj: any, paths: string[]): T | undefined {
  for (const path of paths) {
    const parts = path.split('.')
    let cur = obj
    let ok = true
    for (const p of parts) {
      if (cur && (p in cur)) cur = cur[p]
      else {
        ok = false
        break
      }
    }
    if (ok && cur !== undefined && cur !== null) return cur as T
  }
  return undefined
}

function toNum(v: any): number | undefined {
  if (v === undefined || v === null || v === '') return undefined
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : undefined
}

function teamCompat(t: any): Team {
  return new Proxy(
    {
      id: t?.id,
      display_name: t?.display_name ?? t?.name ?? t?.full_name ?? '',
      abbreviation: t?.abbreviation ?? t?.abbr,
      league: t?.league,
      division: t?.division,
      location: t?.location,
    },
    {
      get(target, prop) {
        if (prop === 'full_name') return `${target.display_name}`
        // @ts-ignore
        return target[prop]
      },
    }
  ) as Team
}

function readDate(g: any): string {
  const v = pick<string>(g, ['date', 'game_date', 'gameDate', 'start_time', 'startTime'])
  return typeof v === 'string' ? v : ''
}

function readStatus(g: any): string | undefined {
  return pick<string>(g, ['status', 'game_status', 'state', 'status_code', 'statusCode'])
}

function readScore(g: any, side: 'home' | 'away'): number | undefined {
  const candidates =
    side === 'home'
      ? [
          'home_team_data.runs',
          'home_team_score',
          'home_score',
          'score_home',
          'linescore.home.R',
          'linescore.teams.home.runs',
          'boxscore.home.r',
          'home.runs',
        ]
      : [
          'away_team_data.runs',
          'away_team_score',
          'away_score',
          'score_away',
          'linescore.away.R',
          'linescore.teams.away.runs',
          'boxscore.away.r',
          'away.runs',
        ]
  return toNum(pick<any>(g, candidates))
}

function normalizeGameShape(g: any): Game {
  return {
    id: g.id ?? g.game_id ?? g.gameId,
    date: readDate(g),
    home_team: teamCompat(g.home_team ?? g.homeTeam ?? g.home),
    visitor_team: teamCompat(g.away_team ?? g.awayTeam ?? g.away ?? g.visitor_team ?? g.visitor),
    home_team_score: readScore(g, 'home'),
    visitor_team_score: readScore(g, 'away'),
    season: g.season ?? g.year,
    status: readStatus(g),
  }
}

// -----------------------------
// Query builders
// -----------------------------

function buildSearchParams(
  base: Record<string, string | number | boolean | undefined | null> = {},
  arrayParams: Array<[key: string, values: Array<string | number>]> = []
): URLSearchParams {
  const u = new URLSearchParams()
  for (const [k, v] of Object.entries(base)) {
    if (v === undefined || v === null || v === '') continue
    u.set(k, String(v))
  }
  for (const [key, values] of arrayParams) {
    for (const v of values) u.append(`${key}[]`, String(v))
  }
  return u
}

// -----------------------------
// Public API
// -----------------------------

export const Api = {
  /**
   * Aggregate per-player season stats from /stats when /season_stats is empty.
   * Returns Map<player_id, { avg?, hr?, so?, era?, first_name?, last_name?, full_name? }>
   */
  aggregateSeasonStats: async (opts: {
    team_ids: number[]
    seasons: number[]
    postseason?: boolean
    per_page?: number
  }): Promise<Map<number, Partial<Player>>> => {
    const { team_ids, seasons, postseason = false, per_page = 500 } = opts
    const params = (cursor?: number | string) =>
      buildSearchParams({ cursor, per_page, postseason }, [
        ['team_ids', team_ids],
        ['seasons', seasons],
      ])

    const pageFn = async (cursor?: number | string) => {
      const j: any = await apiFetch(`/stats?${params(cursor).toString()}`)
      return { data: j.data || [], meta: j.meta } as Paginated<any>
    }

    const rows = await collectAllCursor(pageFn)

    // DEBUG
    if (import.meta.env.VITE_DEBUG === '1') {
      console.debug('[bdl][stats] rows:', rows.length)
      if (rows.length) console.debug('[bdl][stats] sample row:', JSON.stringify(rows[0], null, 2).slice(0, 2000))
    }

    const bat: Record<number, { H: number; AB: number; HR: number }> = {}
    const pit: Record<number, { SO: number; ER: number; IP: number }> = {}
    const names: Record<number, { first_name?: string; last_name?: string; full_name?: string }> = {}

    for (const r of rows) {
      const pidNum = Number(r.player_id ?? r.player?.id)
      if (!Number.isFinite(pidNum)) continue

      // names
      const first = r.player?.first_name ?? r.first_name
      const last = r.player?.last_name ?? r.last_name
      const full = r.player?.full_name ?? r.player?.name ?? (first && last ? `${first} ${last}` : undefined)
      const ref = (names[pidNum] ||= {})
      if (first) ref.first_name = first
      if (last) ref.last_name = last
      if (full) ref.full_name = full

      // batting
      const H = pickNum(r, ['hits', 'H', 'batting.h', 'hitting.h'])
      const AB = pickNum(r, ['at_bats', 'AB', 'batting.ab', 'hitting.ab'])
      const HR = pickNum(r, ['home_runs', 'HR', 'hr', 'batting.hr', 'hitting.hr'])
      if (H != null || AB != null || HR != null) {
        const a = (bat[pidNum] ||= { H: 0, AB: 0, HR: 0 })
        addTo(a, 'H', H)
        addTo(a, 'AB', AB)
        addTo(a, 'HR', HR)
      }

      // pitching
      const SO = pickNum(r, ['strikeouts', 'SO', 'K', 'k', 'pitching.so', 'pitching.k'])
      const ER = pickNum(r, ['earned_runs', 'ER', 'pitching.er'])
      const IPdA = inningsToDecimal(pick<any>(r, ['innings_pitched', 'IP', 'pitching.ip']))
      const ipOuts = pickNum(r, ['ip_outs', 'pitching.ip_outs'])
      const IPdB = ipOuts != null ? ipOuts / 3 : undefined
      const IPd = IPdA ?? IPdB
      if (SO != null || ER != null || IPd != null) {
        const p = (pit[pidNum] ||= { SO: 0, ER: 0, IP: 0 })
        addTo(p, 'SO', SO)
        addTo(p, 'ER', ER)
        addTo(p, 'IP', IPd)
      }
    }

    const out = new Map<number, Partial<Player>>()

    // finalize batting (AVG, HR)
    for (const [pidStr, v] of Object.entries(bat)) {
      const pid = Number(pidStr)
      const row: Partial<Player> = { ...(names[pid] ?? {}) }
      if (v.AB > 0) row.avg = v.H / v.AB
      if (v.HR > 0) row.hr = v.HR
      if (Object.keys(row).length) out.set(pid, row)
    }

    // finalize pitching (SO, ERA)
    for (const [pidStr, v] of Object.entries(pit)) {
      const pid = Number(pidStr)
      const prev = { ...(names[pid] ?? {}), ...(out.get(pid) || {}) }
      if (v.SO > 0) prev.so = v.SO
      if (v.IP > 0 && v.ER >= 0) prev.era = (v.ER * 9) / v.IP
      if (Object.keys(prev).length) out.set(pid, prev)
    }

    // DEBUG
    if (import.meta.env.VITE_DEBUG === '1') {
      const keys = Array.from(out.keys()).slice(0, 15)
      console.debug('[bdl][stats] map size:', out.size, 'first keys:', keys)
    }

    return out
  },

  /**
   * Player season stats — primary source. If sparse, your page should call aggregateSeasonStats as a fallback.
   * Returns Map<player_id, { avg?, hr?, so?, era?, first_name?, last_name?, full_name? }>
   */
  playerSeasonStats: async (opts: {
    team_id?: number
    team_ids?: number[]
    seasons: number[]
    postseason?: boolean
    per_page?: number
    includePostseasonToo?: boolean
  }): Promise<Map<number, Partial<Player>>> => {
    const { team_id, team_ids, seasons, postseason = false, per_page = 500, includePostseasonToo } = opts
    const tIds = team_ids?.length ? team_ids : team_id ? [team_id] : []
    const params = (cursor?: number | string) =>
      buildSearchParams({ cursor, per_page, postseason }, [
        ...(tIds.length ? ([['team_ids', tIds]] as any) : []),
        ['seasons', seasons],
      ])

    const pageFn = async (cursor?: number | string) => {
      const j: any = await apiFetch(`/season_stats?${params(cursor).toString()}`)
      return { data: j.data || [], meta: j.meta } as Paginated<any>
    }

    const rows = await collectAllCursor(pageFn)

    // Optional: explicit postseason merge
    if (includePostseasonToo) {
      const postParams = (cursor?: number | string) =>
        buildSearchParams({ cursor, per_page, postseason: true }, [
          ...(tIds.length ? ([['team_ids', tIds]] as any) : []),
          ['seasons', seasons],
        ])
      const postPageFn = async (cursor?: number | string) => {
        const j: any = await apiFetch(`/season_stats?${postParams(cursor).toString()}`)
        return { data: j.data || [], meta: j.meta } as Paginated<any>
      }
      const postRows = await collectAllCursor(postPageFn)
      rows.push(...postRows)
    }

    // DEBUG
    if (import.meta.env.VITE_DEBUG === '1') {
      console.debug('[bdl][season_stats] rows:', rows.length)
      if (rows.length) console.debug('[bdl][season_stats] sample row:', JSON.stringify(rows[0], null, 2).slice(0, 2000))
    }

    const map = new Map<number, Partial<Player>>()

    for (const r of rows) {
      const pidRaw = r.player_id ?? r.player?.id
      const pidNum = Number(pidRaw)
      if (!Number.isFinite(pidNum)) continue

      // batting
      const avg = pickNum(r, ['batting_average', 'ba', 'avg', 'batting.avg', 'hitting.avg'])
      const hr = pickNum(r, ['home_runs', 'hr', 'batting.hr', 'hitting.hr'])

      // pitching
      const so = pickNum(r, ['strikeouts', 'so', 'k', 'pitching.so', 'pitching.k'])
      const era = pickNum(r, ['earned_run_average', 'era', 'pitching.era'])

      // names (if present)
      const first = r.player?.first_name ?? r.first_name
      const last = r.player?.last_name ?? r.last_name
      const full = r.player?.full_name ?? r.player?.name ?? (first && last ? `${first} ${last}` : undefined)

      const cur: Partial<Player> = map.get(pidNum) || {}
      if (avg !== undefined) cur.avg = avg
      if (hr !== undefined) cur.hr = hr
      if (so !== undefined) cur.so = so
      if (era !== undefined) cur.era = era
      if (first) cur.first_name = first
      if (last) cur.last_name = last
      if (full) cur.full_name = full

      map.set(pidNum, cur)
    }

    // DEBUG
    if (import.meta.env.VITE_DEBUG === '1') {
      const keys = Array.from(map.keys()).slice(0, 15)
      console.debug('[bdl][season_stats] map size:', map.size, 'first keys:', keys)
    }

    return map
  },

  // TEAMS
  teams: async (cursor?: number | string, per_page = 30): Promise<Paginated<Team>> => {
    const p = buildSearchParams({ cursor, per_page })
    const json: any = await apiFetch(`/teams?${p.toString()}`)
    return { data: (json.data || []).map(teamCompat), meta: json.meta }
  },

  team: async (id: number): Promise<Team> => {
    const j: any = await apiFetch(`/teams/${id}`)
    const t = j?.data ?? j
    return teamCompat(t)
  },

  // PLAYERS (roster/people)
  players: async (search = '', cursor?: number | string, per_page = 25): Promise<Paginated<Player>> => {
    const p = buildSearchParams({ search, cursor, per_page })
    const json: any = await apiFetch(`/players?${p.toString()}`)
    return { data: json.data || [], meta: json.meta }
  },

  playersByTeam: async (teamId: number, cursor?: number | string, per_page = 100): Promise<Paginated<Player>> => {
    const p = buildSearchParams({ per_page, cursor }, [['team_ids', [teamId]]])
    const j: any = await apiFetch(`/players?${p.toString()}`)
    return { data: j.data || [], meta: j.meta }
  },

  /**
   * GAMES
   * Supported filters:
   * - dates[]: one or many YYYY-MM-DD (preferred)
   * - seasons[]: one or many season years
   * - team_ids[]: one or many team ids
   * - postseason: true|false (omit to include both)
   * - cursor, per_page
   */
  games: async (opts: {
    cursor?: number | string
    per_page?: number
    dates?: string | string[]
    start_date?: string
    end_date?: string
    team_ids?: number[]
    seasons?: number[]
    season?: number
    postseason?: boolean
  } = {}): Promise<Paginated<Game>> => {
    const { cursor, per_page = 50, dates, start_date, end_date, team_ids, seasons, season, postseason } = opts

    let dateList: string[] = []
    if (Array.isArray(dates)) dateList = dates
    else if (typeof dates === 'string' && dates) dateList = [dates]
    else if (start_date && end_date) dateList = eachDay(start_date, end_date)

    const arrayParams: Array<[string, Array<string | number>]> = []
    if (dateList.length) arrayParams.push(['dates', dateList])
    if (Array.isArray(team_ids) && team_ids.length) arrayParams.push(['team_ids', team_ids])
    const seasonsList = Array.isArray(seasons) ? seasons : season ? [season] : []
    if (seasonsList.length) arrayParams.push(['seasons', seasonsList])

    const p = buildSearchParams({ cursor, per_page, postseason }, arrayParams)
    const json: any = await apiFetch(`/games?${p.toString()}`)
    const data: Game[] = (json.data || []).map(normalizeGameShape)
    return { data, meta: json.meta }
  },

  game: async (id: number): Promise<Game> => {
    const j: any = await apiFetch(`/games/${id}`)
    const g = j?.data ?? j
    return normalizeGameShape(g)
  },

  gamesByDate: async (dateISO: string, cursor?: number | string): Promise<Paginated<Game>> => {
    const res = await Api.games({ dates: dateISO, cursor, per_page: 200 })
    const filtered = (res.data || [])
      .filter(g => dayKey(g.date) === dayKey(dateISO))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    return { data: filtered, meta: res.meta }
  },

  gamesRange: async (startISO: string, endISO: string, cursor?: number | string): Promise<Paginated<Game>> => {
    const res = await Api.games({ dates: eachDay(dayKey(startISO), dayKey(endISO)), cursor, per_page: 500 })
    const filtered = (res.data || [])
      .filter(g => inRangeDateOnly(g.date, startISO, endISO))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    return { data: filtered, meta: res.meta }
  },

  standings: async (season: number) =>
    apiFetch(`/standings?${buildSearchParams({}, [['seasons', [season]]]).toString()}`),
}

// -------------------------------------------------------------------
// SMART HELPERS (merge attempts; de-dupe)
// -------------------------------------------------------------------

async function fetchGamesRaw(params: Record<string, string | number | boolean | string[] | number[]>) {
  const start = params['start_date'] as string | undefined
  const end = params['end_date'] as string | undefined

  const datesParam =
    (params['dates'] as string | string[] | undefined) ??
    (start && end ? eachDay(String(start), String(end)) : undefined)

  const teamIds =
    (params['team_ids'] as number[] | undefined) ??
    (params['team_id'] ? [Number(params['team_id'])] : undefined) ??
    (params['teamId'] ? [Number(params['teamId'])] : undefined)

  const seasons =
    (params['seasons'] as number[] | undefined) ??
    (params['season'] ? [Number(params['season'])] : undefined)

  const postseason = params['postseason'] as boolean | undefined
  const per_page = (params['per_page'] as number | string | undefined) ?? 200
  const cursor = params['cursor'] as number | string | undefined

  const p = buildSearchParams(
    { cursor, per_page, postseason },
    [
      ...(datesParam ? ([['dates', Array.isArray(datesParam) ? datesParam : [datesParam]]] as any) : []),
      ...(teamIds?.length ? ([['team_ids', teamIds]] as any) : []),
      ...(seasons?.length ? ([['seasons', seasons]] as any) : []),
    ]
  )

  const j: any = await apiFetch(`/games?${p.toString()}`)
  const data: Game[] = (j.data || []).map(normalizeGameShape)
  return { data, meta: j.meta }
}

export async function gamesForTeamSmart(teamId: number, startYmd: string, endYmd: string) {
  const dates = eachDay(startYmd, endYmd)
  const attempts: Array<Record<string, any>> = [
    { dates, per_page: 500, postseason: true, team_ids: [teamId] },
    { dates, per_page: 500, postseason: false, team_ids: [teamId] },
  ]
  const bag = new Map<number, Game>()
  for (const p of attempts) {
    try {
      const r = await fetchGamesRaw(p)
      for (const g of r.data) bag.set(g.id, g)
    } catch {
      // ignore and try next parameter shape
    }
  }
  return Array.from(bag.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}

export async function gamesInWindowFilterLocal(
  startYmd: string,
  endYmd: string,
  teamIds: number[]
): Promise<Game[]> {
  const dates = eachDay(startYmd, endYmd)

  const [post, reg] = await Promise.allSettled([
    fetchGamesRaw({ dates, per_page: 500, postseason: true }),
    fetchGamesRaw({ dates, per_page: 500, postseason: false }),
  ])

  const a = post.status === 'fulfilled' ? post.value.data : []
  const b = reg.status === 'fulfilled' ? reg.value.data : [] // <-- fixed (was post.value)
  const bag = new Map<number, Game>()
  for (const g of [...a, ...b]) bag.set(g.id, g)

  const idSet = new Set(teamIds)
  return Array.from(bag.values())
    .filter(
      g =>
        (idSet.has(g.home_team.id) || idSet.has(g.visitor_team?.id || -1)) &&
        g.home_team_score != null &&
        g.visitor_team_score != null
    )
    .sort((x, y) => new Date(x.date).getTime() - new Date(y.date).getTime())
}


// -----------------------------
// Players (robust multi-attempt)
// -----------------------------
async function fetchPlayersRaw(params: Record<string, string | number | boolean>) {
  const base: Record<string, string | number | boolean | undefined> = {
    per_page: params['per_page'],
    cursor: params['cursor'],
    search: params['search'],
  }
  const teamId = params['team_id'] ?? params['teamId'] ?? (params as any)['team_ids[]']
  const p = buildSearchParams(base, teamId ? [['team_ids', [Number(teamId)]]] : [])
  const j: any = await apiFetch(`/players?${p.toString()}`)
  return { data: (j.data || []) as Player[], meta: j.meta }
}

export async function playersByTeamSmart(team: Team, cursor?: number | string, per_page = 100) {
  const attempts: Array<Record<string, string | number | boolean>> = [
    { per_page, cursor: cursor ?? '', 'team_ids[]': team.id },
    { per_page, cursor: cursor ?? '', team_id: team.id },
    { per_page, cursor: cursor ?? '', teamId: team.id },
  ]

  const bag = new Map<number, Player>()
  for (const p of attempts) {
    try {
      const r = await fetchPlayersRaw(p)
      for (const pl of r.data) {
        bag.set(pl.id, {
          ...pl,
          team: pl.team ? teamCompat(pl.team) : team,
        })
      }
    } catch {
      // ignore and try next param shape
    }
  }
  return Array.from(bag.values())
}
