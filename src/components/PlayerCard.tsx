import { Player } from '@/services/api'

function posCode(p?: Player) {
  const raw = (p?.position || '').toString().trim().toUpperCase()
  return raw
}

function isPitcher(p: Player) {
  const code = posCode(p)
  // Common pitching role codes
  if (code === 'P' || code === 'SP' || code === 'RP' || code === 'CL') return true
  // Or infer from pitching stats
  return p.era != null || p.so != null || p.whip != null
}

function formatAvg(avg?: number | string) {
  if (avg == null || avg === '') return '—'
  const n = Number(avg)
  return Number.isFinite(n) ? n.toFixed(3) : '—'
}

function formatEra(era?: number | string) {
  if (era == null || era === '') return '—'
  const n = Number(era)
  return Number.isFinite(n) ? n.toFixed(2) : '—'
}

export default function PlayerCard({ p }: { p: Player }) {
  const name = `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() || p.full_name || '—'
  const teamName = p.team?.full_name || p.team?.display_name || '—'
  const pitcher = isPitcher(p)

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold">{name}</div>
          <div className="text-xs text-gray-500">{teamName}</div>
        </div>
        {p.position && <span className="pill">{p.position}</span>}
      </div>

      {/* Stats */}
      {pitcher ? (
        // Pitcher: SO / ERA / WHIP
        <div className="grid grid-cols-3 gap-3 text-center mt-3 text-sm">
          <div>
            <div className="text-gray-500">SO</div>
            <div className="font-semibold">{p.so ?? '—'}</div>
          </div>
          <div>
            <div className="text-gray-500">ERA</div>
            <div className="font-semibold">{formatEra(p.era)}</div>
          </div>
          <div>
            <div className="text-gray-500">WHIP</div>
            <div className="font-semibold">{p.whip ?? '—'}</div>
          </div>
        </div>
      ) : (
        // Hitter: HR / AVG / RBI
        <div className="grid grid-cols-3 gap-3 text-center mt-3 text-sm">
          <div>
            <div className="text-gray-500">HR</div>
            <div className="font-semibold">{p.hr ?? '—'}</div>
          </div>
          <div>
            <div className="text-gray-500">AVG</div>
            <div className="font-semibold">{formatAvg(p.avg)}</div>
          </div>
          <div>
            <div className="text-gray-500">RBI</div>
            <div className="font-semibold">{p.rbi ?? '—'}</div>
          </div>
        </div>
      )}
    </div>
  )
}
