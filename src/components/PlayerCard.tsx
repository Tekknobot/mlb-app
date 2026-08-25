import { Player } from '@/services/api'
import PlayerHeadshot from '@/components/PlayerHeadshot'
import TeamLogo from '@/components/TeamLogo'

function posCode(p?: Player) {
  return (p?.position || '').toString().trim().toUpperCase()
}

function isPitcher(p: Player) {
  const code = posCode(p)
  if (code === 'P' || code === 'SP' || code === 'RP' || code === 'CL') return true
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

function StatBlock({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-center">
      <div className="text-[11px] uppercase tracking-[0.18em] text-gray-400">{label}</div>
      <div className="mt-1 text-xl font-black tracking-tight text-white">{value}</div>
    </div>
  )
}

export default function PlayerCard({ p }: { p: Player }) {
  const name = `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() || p.full_name || '—'
  const teamName = p.team?.full_name || p.team?.display_name || 'Free Agent'
  const pitcher = isPitcher(p)

  return (
    <div className="card h-full">
      <div className="flex items-start gap-4">
        <PlayerHeadshot playerId={p.id} name={name} size={74} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-lg font-bold text-white">{name}</h3>
            {p.position && <span className="pill">{p.position}</span>}
          </div>
          <div className="mt-2 flex items-center gap-2 text-sm text-gray-400">
            {p.team && <TeamLogo team={p.team} size={28} />}
            <span className="truncate">{teamName}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        {pitcher ? (
          <>
            <StatBlock label="SO" value={p.so ?? '—'} />
            <StatBlock label="ERA" value={formatEra(p.era)} />
            <StatBlock label="WHIP" value={p.whip ?? '—'} />
          </>
        ) : (
          <>
            <StatBlock label="HR" value={p.hr ?? '—'} />
            <StatBlock label="AVG" value={formatAvg(p.avg)} />
            <StatBlock label="RBI" value={p.rbi ?? '—'} />
          </>
        )}
      </div>
    </div>
  )
}
