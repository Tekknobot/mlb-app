import { Link } from 'react-router-dom'
import { Game } from '@/services/api'
import { format } from 'date-fns'
import { ymdInTZ, userTZ } from '@/lib/tz' // ✅ use local timezone YMD

function labelFromYmd(ymd: string) {
  return format(new Date(`${ymd}T12:00:00`), 'EEE, MMM d')
}

const TEAM_COLORS: Record<string, string> = {
  BAL: '#DF4601', BOS: '#BD3039', NYY: '#0C2340', TB: '#092C5C', TOR: '#134A8E',
  CWS: '#27251F', CLE: '#00385D', DET: '#0C2C56', KC: '#004687', MIN: '#0C2340',
  HOU: '#002D62', LAA: '#BA0021', OAK: '#003831', SEA: '#0C2C56', TEX: '#003278',
  ATL: '#13274F', MIA: '#00A3E0', NYM: '#002D72', PHI: '#E81828', WSH: '#AB0003',
  CHC: '#0E3386', CIN: '#C6011F', MIL: '#12284B', PIT: '#FDB827', STL: '#C41E3A',
  ARI: '#A71930', COL: '#33006F', LAD: '#005A9C', SD: '#2F241D', SF: '#FD5A1E',
}

function contrastText(hex: string): string {
  const c = hex.replace('#', '')
  const r = parseInt(c.substring(0, 2), 16)
  const g = parseInt(c.substring(2, 4), 16)
  const b = parseInt(c.substring(4, 6), 16)
  const yiq = (r * 299 + g * 587 + b * 114) / 1000
  return yiq >= 160 ? '#111827' : '#ffffff'
}

function teamAbbr(team?: { abbreviation?: string; display_name?: string }): string {
  if (!team) return '—'
  if (team.abbreviation) return team.abbreviation.toUpperCase()
  const dn = (team.display_name || '').trim()
  if (!dn) return '—'
  return dn.split(/\s+/).map(s => s[0]).join('').slice(0, 3).toUpperCase()
}

function TeamPill({ abbr }: { abbr: string }) {
  const color = TEAM_COLORS[abbr] || '#64748b'
  const text = contrastText(color)
  return (
    <span
      className="pill"
      style={{ backgroundColor: color, color: text, border: '1px solid rgba(255,255,255,0.25)' }}
      title={abbr}
    >
      {abbr}
    </span>
  )
}

export default function GameCard({
  game,
  forceYmd,
}: {
  game: Game
  forceYmd?: string
}) {
  const ymdLocal = forceYmd ?? ymdInTZ(game.date, userTZ)
  const label = labelFromYmd(ymdLocal)
  const dateParam = encodeURIComponent(ymdLocal)

  const url = `/game/${game.id}?date=${dateParam}&homeId=${game.home_team.id}${
    game.visitor_team ? `&awayId=${game.visitor_team.id}` : ''
  }`

  const statusLabel = (game as any)?.status || 'Scheduled'

  const awayAbbr = teamAbbr(game.visitor_team)
  const homeAbbr = teamAbbr(game.home_team)

  return (
    <Link to={url} className="block">
      <div className="card hover:opacity-95 active:opacity-90">
        <div className="flex items-center justify-between">
          <div className="font-semibold">{label}</div>
          <span className="pill" data-status={statusLabel}>
            {statusLabel}
          </span>
        </div>

        <div className="hr-seam" />

        {/* ⬇️ changed items-center -> items-start */}
        <div className="mt-2 grid grid-cols-2 gap-3 items-start">
          <div className="text-right">
            <div className="flex items-center justify-end gap-2">
              <div className="text-sm text-gray-300">Away</div>
              <TeamPill abbr={awayAbbr} />
            </div>
            <div className="font-bold">{game.visitor_team?.full_name}</div>
            <div className="text-2xl font-bold text-chalk">{game.visitor_team_score ?? ''}</div>
          </div>
          <div className="text-left">
            <div className="flex items-center justify-start gap-2">
              <div className="text-sm text-gray-300">Home</div>
              <TeamPill abbr={homeAbbr} />
            </div>
            <div className="font-bold">{game.home_team.full_name}</div>
            <div className="text-2xl font-bold text-chalk">{game.home_team_score ?? ''}</div>
          </div>
        </div>
      </div>
    </Link>
  )
}
