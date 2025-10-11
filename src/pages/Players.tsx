
import { useEffect, useMemo, useState } from 'react'
import { Api, Player } from '@/services/api'
import PlayerCard from '@/components/PlayerCard'

export default function PlayersPage() {
  const [query, setQuery] = useState('')
  const [players, setPlayers] = useState<Player[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const q = useMemo(() => query.trim(), [query])

  useEffect(() => {
    setLoading(true); setError(null)
    Api.players(q, page).then(p => {
      setPlayers(prev => page === 1 ? p.data : [...prev, ...p.data])
      setHasMore((p.meta?.next_page ?? null) !== null || Boolean(p.links?.next || p.next))
    }).catch(err => setError(String(err))).finally(() => setLoading(false))
  }, [q, page])

  return (
    <div className="pb-24 p-3 max-w-2xl mx-auto">
      <header className="mb-3 space-y-2">
        <div className="font-bold">Players</div>
        <input
          type="search"
          placeholder="Search players…"
          value={query}
          onChange={e => { setQuery(e.target.value); setPage(1) }}
          className="w-full border rounded-xl px-3 py-2"
        />
      </header>

      {error && <div className="text-center text-red-600">{error}</div>}

      <div className="grid grid-cols-1 gap-3">
        {players.map(p => <PlayerCard key={p.id} p={p} />)}
      </div>

      <div className="mt-3 flex justify-center">
        {hasMore && !loading && (
          <button className="px-4 py-2 rounded-xl bg-black text-white" onClick={() => setPage(pg => pg + 1)}>
            Load more
          </button>
        )}
        {loading && <div className="text-gray-500">Loading…</div>}
      </div>
    </div>
  )
}
