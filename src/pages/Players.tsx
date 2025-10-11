import { useEffect, useMemo, useState } from 'react'
import { Api, Player } from '@/services/api'
import PlayerCard from '@/components/PlayerCard'

export default function PlayersPage() {
  const [query, setQuery] = useState('')
  const [players, setPlayers] = useState<Player[]>([])
  const [cursor, setCursor] = useState<string | number | undefined>(undefined)
  const [nextCursor, setNextCursor] = useState<string | number | undefined>(undefined)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const q = useMemo(() => query.trim(), [query])

  // Reset list when search changes
  useEffect(() => {
    setPlayers([])
    setCursor(undefined)      // start from first page
    setNextCursor(undefined)
    setHasMore(true)
    setError(null)
  }, [q])

  useEffect(() => {
    let alive = true
    async function run() {
      if (!hasMore && cursor === undefined && players.length > 0) return
      setLoading(true); setError(null)
      try {
        // per_page optional (tune as you like)
        const res = await Api.players(q, cursor, 50)
        if (!alive) return
        const data = res.data ?? []
        const nc = res.meta?.next_cursor

        setPlayers(prev => (cursor === undefined ? data : [...prev, ...data]))
        setNextCursor(nc)
        setHasMore(Boolean(nc))
      } catch (e: any) {
        if (!alive) return
        setError(e?.message || 'Failed to load players')
      } finally {
        if (alive) setLoading(false)
      }
    }
    run()
    return () => { alive = false }
  }, [q, cursor])

  return (
    <div className="pb-24 p-3 max-w-2xl mx-auto">
      <header className="mb-3 space-y-2">
        <div className="font-bold">Players</div>
        <input
          type="search"
          placeholder="Search players…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full border rounded-xl px-3 py-2"
        />
      </header>

      {error && <div className="text-center text-red-600">{error}</div>}

      <div className="grid grid-cols-1 gap-3">
        {players.map(p => <PlayerCard key={p.id} p={p} />)}
      </div>

      <div className="mt-3 flex justify-center">
        {hasMore && !loading && (
          <button
            className="px-4 py-2 rounded-xl bg-black text-white"
            onClick={() => setCursor(nextCursor)}
          >
            Load more
          </button>
        )}
        {loading && <div className="text-gray-500">Loading…</div>}
        {!loading && !hasMore && players.length > 0 && (
          <div className="text-gray-500 text-sm">No more results.</div>
        )}
      </div>
    </div>
  )
}
