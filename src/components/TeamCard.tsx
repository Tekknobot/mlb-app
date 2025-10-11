
import { Team } from '@/services/api'

export default function TeamCard({ team }: { team: Team }) {
  return (
    <div className="card flex items-center justify-between">
      <div>
        <div className="font-bold">{team.full_name}</div>
        <div className="text-xs text-gray-500">{[team.city, team.division, team.conference].filter(Boolean).join(' • ')}</div>
      </div>
      <div className="pill">{team.abbreviation}</div>
    </div>
  )
}
