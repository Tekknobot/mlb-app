// src/services/api.ts — public MLB StatsAPI client (no account / no API key)

/**
 * MLB's public JSON endpoints are used directly in production.
 * During local Vite development `/mlb-api` is proxied to statsapi.mlb.com.
 *
 * Optional override:
 *   VITE_MLB_API_BASE_URL=https://statsapi.mlb.com/api
 */
const BASE_URL =
  (import.meta.env.VITE_MLB_API_BASE_URL as string | undefined) ??
  (import.meta.env.DEV ? '/mlb-api' : 'https://statsapi.mlb.com/api')

const DEBUG = import.meta.env.VITE_DEBUG === '1'

type FetchOptions = RequestInit & { signal?: AbortSignal }

export interface Team {
  id: number
  display_name: string
  full_name: string
  abbreviation?: string
  league?: string
  division?: string
  location?: string
}

export interface Player {
  id: number
  first_name: string
  last_name: string
  full_name?: string
  position?: string
  team?: Team
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

const dayKey = (iso: string) => (iso ?? '').slice(0, 10)

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

function seasonForDate(value = new Date()) {
  return value.getFullYear()
}

function num(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined
  const n = Number(value)
  return Number.isFinite(n) ? n : undefined
}

function splitName(fullName = '') {
  const bits = fullName.trim().split(/\s+/).filter(Boolean)
  return {
    first: bits[0] ?? '',
    last: bits.length > 1 ? bits.slice(1).join(' ') : '',
  }
}

function buildParams(values: Record<string, string | number | boolean | undefined | null>) {
  const p = new URLSearchParams()
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined || value === null || value === '') continue
    p.set(key, String(value))
  }
  return p
}

async function apiFetch<T>(path: string, opts: FetchOptions = {}): Promise<T> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 20000)
  const url = `${BASE_URL}${path}`

  if (DEBUG) console.debug('[mlb:request]', url)

  try {
    const res = await fetch(url, {
      ...opts,
      signal: opts.signal ?? controller.signal,
      headers: {
        Accept: 'application/json',
        ...(opts.headers as Record<string, string> | undefined),
      },
    })

    const text = await res.text()
    if (!res.ok) {
      if (DEBUG) console.error('[mlb:error]', res.status, url, text.slice(0, 500))
      throw new Error(`MLB data request failed (${res.status})`)
    }

    try {
      return JSON.parse(text) as T
    } catch {
      throw new Error('MLB returned invalid JSON')
    }
  } finally {
    clearTimeout(timeout)
  }
}

function normalizeTeam(raw: any): Team {
  const name = raw?.name ?? raw?.display_name ?? raw?.full_name ?? raw?.teamName ?? ''
  return {
    id: Number(raw?.id ?? 0),
    display_name: name,
    full_name: name,
    abbreviation: raw?.abbreviation ?? raw?.abbr,
    league: raw?.league?.name ?? raw?.league,
    division: raw?.division?.name ?? raw?.division,
    location: raw?.locationName ?? raw?.location,
  }
}

function normalizeScheduleGame(raw: any): Game {
  const awayRaw = raw?.teams?.away?.team ?? raw?.away_team ?? raw?.awayTeam ?? raw?.away
  const homeRaw = raw?.teams?.home?.team ?? raw?.home_team ?? raw?.homeTeam ?? raw?.home
  const away = normalizeTeam(awayRaw)
  const home = normalizeTeam(homeRaw)
  const awayScore = num(raw?.teams?.away?.score ?? raw?.away_team_score ?? raw?.away_score)
  const homeScore = num(raw?.teams?.home?.score ?? raw?.home_team_score ?? raw?.home_score)

  return {
    id: Number(raw?.gamePk ?? raw?.id ?? raw?.game_id ?? 0),
    date: raw?.gameDate ?? raw?.date ?? raw?.officialDate ?? '',
    home_team: home,
    away_team: away,
    visitor_team: away,
    home_team_score: homeScore,
    away_team_score: awayScore,
    visitor_team_score: awayScore,
    season: num(raw?.season),
    status:
      raw?.status?.detailedState ??
      raw?.status?.abstractGameState ??
      raw?.status ??
      'Scheduled',
  }
}

function normalizeLiveFeed(raw: any): Game {
  const gd = raw?.gameData ?? {}
  const live = raw?.liveData ?? {}
  const away = normalizeTeam(gd?.teams?.away)
  const home = normalizeTeam(gd?.teams?.home)
  const awayScore = num(live?.linescore?.teams?.away?.runs)
  const homeScore = num(live?.linescore?.teams?.home?.runs)

  return {
    id: Number(gd?.game?.pk ?? gd?.gamePk ?? raw?.gamePk ?? 0),
    date: gd?.datetime?.dateTime ?? gd?.datetime?.officialDate ?? '',
    home_team: home,
    away_team: away,
    visitor_team: away,
    home_team_score: homeScore,
    away_team_score: awayScore,
    visitor_team_score: awayScore,
    season: num(gd?.game?.season),
    status: gd?.status?.detailedState ?? gd?.status?.abstractGameState ?? 'Scheduled',
  }
}

function normalizePerson(raw: any): Player {
  const full = raw?.fullName ?? raw?.full_name ?? raw?.name ?? ''
  const names = splitName(full)
  const teamRaw = raw?.currentTeam ?? raw?.team

  return {
    id: Number(raw?.id ?? 0),
    first_name: raw?.firstName ?? raw?.first_name ?? names.first,
    last_name: raw?.lastName ?? raw?.last_name ?? names.last,
    full_name: full || undefined,
    position:
      raw?.primaryPosition?.abbreviation ??
      raw?.primaryPosition?.code ??
      raw?.position?.abbreviation ??
      raw?.position,
    team: teamRaw?.id ? normalizeTeam(teamRaw) : undefined,
  }
}

// Team cache improves schedule/team rendering without forcing every page to load teams first.
let teamCache: Team[] | null = null
let teamCachePromise: Promise<Team[]> | null = null

async function getTeams(): Promise<Team[]> {
  if (teamCache) return teamCache
  if (!teamCachePromise) {
    teamCachePromise = apiFetch<any>('/v1/teams?sportId=1&hydrate=league,division')
      .then(json => {
        const teams: Team[] = (json?.teams ?? []).map(normalizeTeam)
        teamCache = teams
        return teams
      })
      .finally(() => {
        teamCachePromise = null
      })
  }
  return teamCachePromise
}

function enrichTeam(team: Team, cache: Team[]) {
  const full = cache.find(t => t.id === team.id)
  return full ? { ...team, ...full } : team
}

async function enrichGameTeams(games: Game[]) {
  try {
    const teams = await getTeams()
    return games.map(g => {
      const home = enrichTeam(g.home_team, teams)
      const away = g.visitor_team ? enrichTeam(g.visitor_team, teams) : undefined
      return {
        ...g,
        home_team: home,
        away_team: away,
        visitor_team: away,
      }
    })
  } catch {
    return games
  }
}

type SeasonStats = Map<number, Partial<Player>>
const seasonStatsCache = new Map<number, Promise<SeasonStats>>()

function applyStatSplit(out: SeasonStats, split: any, group: 'hitting' | 'pitching') {
  const id = Number(split?.player?.id)
  if (!Number.isFinite(id)) return
  const stat = split?.stat ?? {}
  const current = out.get(id) ?? {}

  if (group === 'hitting') {
    const avg = num(stat.avg)
    const hr = num(stat.homeRuns)
    const rbi = num(stat.rbi)
    if (avg !== undefined) current.avg = avg
    if (hr !== undefined) current.hr = hr
    if (rbi !== undefined) current.rbi = rbi
  } else {
    const era = num(stat.era)
    const so = num(stat.strikeOuts)
    const whip = num(stat.whip)
    if (era !== undefined) current.era = era
    if (so !== undefined) current.so = so
    if (whip !== undefined) current.whip = whip
  }

  const full = split?.player?.fullName
  if (full) {
    const names = splitName(full)
    current.full_name = full
    current.first_name = current.first_name ?? names.first
    current.last_name = current.last_name ?? names.last
  }

  if (split?.team?.id) current.team = normalizeTeam(split.team)
  out.set(id, current)
}

async function getSeasonStats(season: number): Promise<SeasonStats> {
  const existing = seasonStatsCache.get(season)
  if (existing) return existing

  const promise = (async () => {
    const out: SeasonStats = new Map()
    const makePath = (group: 'hitting' | 'pitching') => {
      const p = buildParams({
        stats: 'season',
        group,
        season,
        sportIds: 1,
        limit: 2000,
      })
      return `/v1/stats?${p.toString()}`
    }

    const [hit, pitch] = await Promise.allSettled([
      apiFetch<any>(makePath('hitting')),
      apiFetch<any>(makePath('pitching')),
    ])

    if (hit.status === 'fulfilled') {
      for (const block of hit.value?.stats ?? []) {
        for (const split of block?.splits ?? []) applyStatSplit(out, split, 'hitting')
      }
    }
    if (pitch.status === 'fulfilled') {
      for (const block of pitch.value?.stats ?? []) {
        for (const split of block?.splits ?? []) applyStatSplit(out, split, 'pitching')
      }
    }

    return out
  })()

  seasonStatsCache.set(season, promise)
  return promise
}

const playerDirectoryCache = new Map<number, Promise<Player[]>>()

async function getPlayerDirectory(season: number): Promise<Player[]> {
  const existing = playerDirectoryCache.get(season)
  if (existing) return existing

  const promise = (async () => {
    const p = buildParams({ season, hydrate: 'currentTeam' })
    const json: any = await apiFetch(`/v1/sports/1/players?${p.toString()}`)
    const players: Player[] = (json?.people ?? []).map(normalizePerson)

    // Stats are an enhancement. A schema/availability change must not break player search.
    try {
      const stats = await getSeasonStats(season)
      return players.map(p => {
        const s = stats.get(p.id)
        return s ? { ...p, ...s, team: s.team ?? p.team } : p
      })
    } catch {
      return players
    }
  })()

  playerDirectoryCache.set(season, promise)
  return promise
}

function minMaxDates(dates: string[]) {
  const clean = dates.filter(Boolean).map(dayKey).sort()
  return clean.length ? { start: clean[0], end: clean[clean.length - 1] } : null
}

async function fetchSchedule(opts: {
  dates?: string[]
  start?: string
  end?: string
  season?: number
  teamId?: number
  gamePk?: number
}): Promise<Game[]> {
  const range = opts.dates?.length ? minMaxDates(opts.dates) : null
  const startDate = opts.start ?? range?.start
  const endDate = opts.end ?? range?.end

  const p = buildParams({
    sportId: 1,
    startDate,
    endDate,
    season: opts.season,
    teamId: opts.teamId,
    gamePk: opts.gamePk,
    hydrate: 'team,linescore',
  })

  const json: any = await apiFetch(`/v1/schedule?${p.toString()}`)
  const rawGames = (json?.dates ?? []).flatMap((d: any) => d?.games ?? [])
  return enrichGameTeams(rawGames.map(normalizeScheduleGame))
}

export const Api = {
  teams: async (_cursor?: number | string, per_page = 30): Promise<Paginated<Team>> => {
    const teams = (await getTeams()).slice().sort((a, b) => a.full_name.localeCompare(b.full_name))
    return { data: teams.slice(0, Math.max(per_page, teams.length)), meta: { per_page } }
  },

  team: async (id: number): Promise<Team> => {
    const cached = (await getTeams()).find(t => t.id === id)
    if (cached) return cached
    const json: any = await apiFetch(`/v1/teams/${id}?hydrate=league,division`)
    const raw = json?.teams?.[0] ?? json
    return normalizeTeam(raw)
  },

  players: async (search = '', cursor?: number | string, per_page = 25): Promise<Paginated<Player>> => {
    const season = seasonForDate()
    const all = await getPlayerDirectory(season)
    const q = search.trim().toLocaleLowerCase()
    const filtered = q
      ? all.filter(p => {
          const haystack = `${p.full_name ?? ''} ${p.first_name} ${p.last_name} ${p.team?.full_name ?? ''} ${p.position ?? ''}`.toLocaleLowerCase()
          return haystack.includes(q)
        })
      : all

    const offset = Math.max(0, Number(cursor ?? 0) || 0)
    const page = filtered.slice(offset, offset + per_page)
    const next = offset + per_page < filtered.length ? offset + per_page : undefined
    return { data: page, meta: { next_cursor: next, per_page } }
  },

  playersByTeam: async (teamId: number, _cursor?: number | string, per_page = 100): Promise<Paginated<Player>> => {
    const season = seasonForDate()
    const p = buildParams({ rosterType: 'active', season })
    const [json, team, stats] = await Promise.all([
      apiFetch<any>(`/v1/teams/${teamId}/roster?${p.toString()}`),
      Api.team(teamId),
      getSeasonStats(season).catch(() => new Map<number, Partial<Player>>()),
    ])

    const data = (json?.roster ?? []).slice(0, per_page).map((entry: any) => {
      const base = normalizePerson({
        ...entry?.person,
        position: entry?.position,
        currentTeam: team,
      })
      const s = stats.get(base.id)
      return s ? { ...base, ...s, team } : { ...base, team }
    })
    return { data, meta: { per_page } }
  },

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
    // `postseason` and cursor are accepted only for backwards UI compatibility.
    // MLB schedule results already include the game types present in the requested window.
    const dates = Array.isArray(opts.dates) ? opts.dates : opts.dates ? [opts.dates] : undefined
    const season = opts.seasons?.[0] ?? opts.season
    const teamIds = opts.team_ids?.filter(Number.isFinite) ?? []

    let games: Game[] = []
    if (teamIds.length > 1) {
      const sets = await Promise.all(
        teamIds.map(teamId =>
          fetchSchedule({
            dates,
            start: opts.start_date,
            end: opts.end_date,
            season,
            teamId,
          })
        )
      )
      const bag = new Map<number, Game>()
      for (const list of sets) for (const game of list) bag.set(game.id, game)
      games = Array.from(bag.values())
    } else {
      games = await fetchSchedule({
        dates,
        start: opts.start_date,
        end: opts.end_date,
        season,
        teamId: teamIds[0],
      })
    }

    games.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    return { data: games, meta: { per_page: opts.per_page ?? games.length } }
  },

  game: async (id: number): Promise<Game> => {
    try {
      const json: any = await apiFetch(`/v1.1/game/${id}/feed/live`)
      const game = normalizeLiveFeed(json)
      const [enriched] = await enrichGameTeams([game])
      return enriched
    } catch {
      // The schedule lookup is a useful fallback for future/not-yet-live games.
      const games = await fetchSchedule({ gamePk: id })
      const game = games.find(g => g.id === id) ?? games[0]
      if (!game) throw new Error('Game not found')
      return game
    }
  },

  gamesByDate: async (dateISO: string, _cursor?: number | string): Promise<Paginated<Game>> => {
    const res = await Api.games({ dates: dateISO, per_page: 200 })
    return { data: res.data, meta: res.meta }
  },

  gamesRange: async (startISO: string, endISO: string, _cursor?: number | string): Promise<Paginated<Game>> => {
    const res = await Api.games({ start_date: dayKey(startISO), end_date: dayKey(endISO), per_page: 500 })
    return { data: res.data, meta: res.meta }
  },

  standings: async (season: number) => {
    const p = buildParams({
      leagueId: '103,104',
      season,
      standingsTypes: 'regularSeason',
      hydrate: 'team',
    })
    return apiFetch(`/v1/standings?${p.toString()}`)
  },

  playerSeasonStats: async (opts: {
    team_id?: number
    team_ids?: number[]
    seasons: number[]
    postseason?: boolean
    per_page?: number
    includePostseasonToo?: boolean
  }): Promise<Map<number, Partial<Player>>> => {
    const season = opts.seasons[0] ?? seasonForDate()
    const stats = await getSeasonStats(season)
    const teamIds = new Set([...(opts.team_ids ?? []), ...(opts.team_id ? [opts.team_id] : [])])
    if (!teamIds.size) return new Map(stats)

    const players = await getPlayerDirectory(season)
    const allowed = new Set(players.filter(p => p.team?.id && teamIds.has(p.team.id)).map(p => p.id))
    return new Map(Array.from(stats.entries()).filter(([id]) => allowed.has(id)))
  },

  aggregateSeasonStats: async (opts: {
    team_ids: number[]
    seasons: number[]
    postseason?: boolean
    per_page?: number
  }): Promise<Map<number, Partial<Player>>> => {
    return Api.playerSeasonStats({ team_ids: opts.team_ids, seasons: opts.seasons })
  },
}

export async function gamesForTeamSmart(teamId: number, startYmd: string, endYmd: string) {
  const res = await Api.games({
    start_date: startYmd,
    end_date: endYmd,
    team_ids: [teamId],
    per_page: 500,
  })
  return res.data
}

export async function gamesInWindowFilterLocal(
  startYmd: string,
  endYmd: string,
  teamIds: number[]
): Promise<Game[]> {
  const res = await Api.games({ start_date: startYmd, end_date: endYmd, per_page: 500 })
  const ids = new Set(teamIds)
  return res.data
    .filter(
      g =>
        (ids.has(g.home_team.id) || ids.has(g.visitor_team?.id ?? -1)) &&
        g.home_team_score != null &&
        g.visitor_team_score != null
    )
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}

export async function playersByTeamSmart(team: Team, cursor?: number | string, per_page = 100) {
  const res = await Api.playersByTeam(team.id, cursor, per_page)
  return res.data.map(player => ({ ...player, team }))
}

// Kept exported for any old callers that imported these helpers indirectly.
export { eachDay }
