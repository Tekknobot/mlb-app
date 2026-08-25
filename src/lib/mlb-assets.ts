import type { Team } from '@/services/api'

const TEAM_COLORS: Record<string, string> = {
  ARI: '#A71930', ATL: '#CE1141', BAL: '#DF4601', BOS: '#BD3039', CHC: '#0E3386',
  CWS: '#27251F', CIN: '#C6011F', CLE: '#E31937', COL: '#33006F', DET: '#0C2340',
  HOU: '#EB6E1F', KC: '#004687', LAA: '#BA0021', LAD: '#005A9C', MIA: '#00A3E0',
  MIL: '#12284B', MIN: '#002B5C', NYM: '#002D72', NYY: '#132448', OAK: '#003831',
  PHI: '#E81828', PIT: '#FDB827', SD: '#2F241D', SEA: '#0C2C56', SF: '#FD5A1E',
  STL: '#C41E3A', TB: '#092C5C', TEX: '#003278', TOR: '#134A8E', WSH: '#AB0003',
}

export function teamAbbr(team?: Partial<Team> | null) {
  if (!team) return '—'
  if (team.abbreviation) return team.abbreviation.toUpperCase()
  const dn = (team.display_name || team.full_name || '').trim()
  if (!dn) return '—'
  return dn.split(/\s+/).map(s => s[0]).join('').slice(0, 3).toUpperCase()
}

export function teamLogoUrl(teamId?: number | null) {
  if (!teamId) return ''
  return `https://www.mlbstatic.com/team-logos/${teamId}.svg`
}

export function playerHeadshotUrl(playerId?: number | null) {
  if (!playerId) return ''
  return `https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_426,q_auto:best/v1/people/${playerId}/headshot/67/current`
}

export function teamColor(team?: Partial<Team> | null) {
  return TEAM_COLORS[teamAbbr(team)] || '#64748b'
}

export function contrastText(hex: string): string {
  const c = hex.replace('#', '')
  const r = parseInt(c.substring(0, 2), 16)
  const g = parseInt(c.substring(2, 4), 16)
  const b = parseInt(c.substring(4, 6), 16)
  const yiq = (r * 299 + g * 587 + b * 114) / 1000
  return yiq >= 160 ? '#111827' : '#ffffff'
}
