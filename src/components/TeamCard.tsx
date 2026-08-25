import { Team } from '@/services/api'
import TeamLogo from '@/components/TeamLogo'
import { teamAbbr } from '@/lib/mlb-assets'

export default function TeamCard({ team }: { team: Team }) {
  const abbr = teamAbbr(team)
  const location = team.location ?? ''
  const league = team.league ?? 'Major League Baseball'
  const division = team.division ?? 'Division TBD'

  return (
    <div className="card h-full">
      <div className="flex items-start gap-4">
        <TeamLogo team={team} size={56} ring />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-lg font-bold text-white">{team.full_name}</h3>
            <span className="pill">{abbr}</span>
          </div>
          <div className="mt-1 text-sm text-gray-400">
            {location ? `${location} • ` : ''}{league}{division ? ` • ${division}` : ''}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
          <div className="text-[11px] uppercase tracking-[0.16em] text-gray-400">League</div>
          <div className="mt-1 font-semibold text-white">{league}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
          <div className="text-[11px] uppercase tracking-[0.16em] text-gray-400">Division</div>
          <div className="mt-1 font-semibold text-white">{division}</div>
        </div>
      </div>
    </div>
  )
}
