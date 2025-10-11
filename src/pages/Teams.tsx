
import { useEffect, useState } from 'react'
import { Api, Team } from '@/services/api'
import TeamCard from '@/components/TeamCard'

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true); setError(null)
    Api.teams().then(p => setTeams(p.data)).catch(err => setError(String(err))).finally(() => setLoading(false))
  }, [])

  return (
    <div className="pb-20 p-3 max-w-2xl mx-auto">
      <header className="mb-3 font-bold">Teams</header>
      {loading && <div className="text-center text-gray-500">Loading…</div>}
      {error && <div className="text-center text-red-600">{error}</div>}
      <div className="grid grid-cols-1 gap-3">
        {teams.map(t => <TeamCard key={t.id} team={t} />)}
      </div>
    </div>
  )
}
