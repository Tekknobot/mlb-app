import { Link } from 'react-router-dom'
import { Game } from '@/services/api'
import { ymdInTZ, userTZ } from '@/lib/tz'
import TeamLogo from '@/components/TeamLogo'
import { teamAbbr, teamColor } from '@/lib/mlb-assets'

function gameTimeLabel(iso?: string, status?: string) {
  if (!iso) return status || 'Scheduled'
  const s = (status || '').toLowerCase()
  if (s.includes('final') || s.includes('progress') || s.includes('live') || s.includes('delay')) return status || ''
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(iso))
}

function TeamRow({
  team,
  score,
  side,
}: {
  team?: Game['home_team'] | Game['visitor_team']
  score?: number
  side: 'Away' | 'Home'
}) {
  const abbr = teamAbbr(team)
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/[0.15] bg-black/20 p-3 backdrop-blur-[1px]">
      <TeamLogo team={team} size={42} />
      <div className="min-w-0 flex-1">
        <div className="text-[11px] uppercase tracking-[0.16em] text-white/[0.65]">{side}</div>
        <div className="truncate font-semibold text-white">{team?.full_name || team?.display_name || '—'}</div>
        <div className="text-xs text-white/[0.65]">{abbr}</div>
      </div>
      <div className="text-3xl font-black tracking-tight text-white">{score ?? '—'}</div>
    </div>
  )
}

export default function GameCard({ game, forceYmd }: { game: Game; forceYmd?: string }) {
  const ymdLocal = forceYmd ?? ymdInTZ(game.date, userTZ)
  const label = new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date(`${ymdLocal}T12:00:00`))
  const dateParam = encodeURIComponent(ymdLocal)
  const url = `/game/${game.id}?date=${dateParam}&homeId=${game.home_team.id}${game.visitor_team ? `&awayId=${game.visitor_team.id}` : ''}`
  const statusLabel = game.status || 'Scheduled'
  const homeColor = teamColor(game.home_team)
  const panelBackground = `linear-gradient(145deg, rgba(4, 10, 18, 0.26), rgba(4, 10, 18, 0.48)), ${homeColor}`

  return (
    <Link to={url} className="block h-full">
      <div
        className="card h-full border-white/[0.20] transition duration-150 hover:-translate-y-0.5 hover:border-white/[0.35]"
        style={{ background: panelBackground }}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-sm font-semibold text-white">{label}</div>
            <div className="text-xs text-white/[0.65]">Game #{game.id}</div>
          </div>
          <div className="flex items-center gap-2">
            <span className="pill" data-status={statusLabel}>{statusLabel}</span>
            <span className="pill">{gameTimeLabel(game.date, statusLabel)}</span>
          </div>
        </div>

        <div className="hr-seam" />

        <div className="space-y-3">
          <TeamRow team={game.visitor_team || game.away_team} score={game.visitor_team_score ?? game.away_team_score} side="Away" />
          <TeamRow team={game.home_team} score={game.home_team_score} side="Home" />
        </div>
      </div>
    </Link>
  )
}
