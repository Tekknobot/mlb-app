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

  useEffect(() => {
    setPlayers([])
    setCursor(undefined)
    setNextCursor(undefined)
    setHasMore(true)
    setError(null)
  }, [q])

  useEffect(() => {
    let alive = true
    async function run() {
      if (!hasMore && cursor === undefined && players.length > 0) return
      setLoading(true)
      setError(null)
      try {
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
    <div className="space-y-5 pb-4">
      <section className="card-panel p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="eyebrow">Players</div>
            <h1 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">Player stat grid</h1>
            <p className="mt-2 max-w-2xl text-sm text-gray-300">Search the active player pool with headshots, team context and core hitting or pitching numbers.</p>
          </div>
          <div className="w-full xl:max-w-md">
            <input
              type="search"
              placeholder="Search players..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="input"
            />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="pill">{players.length} loaded</span>
          {q && <span className="pill">Query: {q}</span>}
        </div>
      </section>

      {error && <div className="card text-center text-red-300">{error}</div>}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {players.map(p => <PlayerCard key={p.id} p={p} />)}
      </section>

      <div className="flex justify-center pb-2 pt-1">
        {hasMore && !loading && (
          <button className="btn" onClick={() => setCursor(nextCursor)}>
            Load more players
          </button>
        )}
        {loading && <div className="card text-center text-gray-300">Loading…</div>}
        {!loading && !hasMore && players.length > 0 && <div className="text-sm text-gray-400">No more results.</div>}
      </div>
    </div>
  )
}
