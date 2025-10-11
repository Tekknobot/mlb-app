import { Team } from '@/services/api'

export default function TeamCard({ team }: { team: Team }) {
  const abbr = team.abbreviation ?? team.display_name.split(' ').map(s => s[0]).join('').slice(0,3).toUpperCase()
  const location = team.location ?? ''
  const league = team.league ?? '—'
  const division = team.division ?? '—'

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold">{team.full_name}</div>
          <div className="text-xs text-gray-500">
            {location ? `${location} • ` : ''}{league}{division ? ` • ${division}` : ''}
          </div>
        </div>
        <span className="pill">{abbr}</span>
      </div>
      {/* …whatever else you render */}
    </div>
  )
}
