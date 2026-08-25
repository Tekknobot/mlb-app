import { useState } from 'react'
import type { Team } from '@/services/api'
import { contrastText, teamAbbr, teamColor, teamLogoUrl } from '@/lib/mlb-assets'

export default function TeamLogo({
  team,
  size = 40,
  ring = false,
}: {
  team?: Partial<Team> | null
  size?: number
  ring?: boolean
}) {
  const [failed, setFailed] = useState(false)
  const url = teamLogoUrl(team?.id)
  const abbr = teamAbbr(team)
  const bg = teamColor(team)
  const fg = contrastText(bg)

  if (!url || failed) {
    return (
      <div
        className={`inline-flex items-center justify-center rounded-full font-black shadow-sm ${ring ? 'ring-1 ring-white/10' : ''}`}
        style={{ width: size, height: size, backgroundColor: bg, color: fg, fontSize: Math.max(11, size * 0.28) }}
        aria-label={abbr}
        title={abbr}
      >
        {abbr}
      </div>
    )
  }

  return (
    <div
      className={`inline-flex items-center justify-center rounded-full bg-white/95 p-1 shadow-sm ${ring ? 'ring-1 ring-white/10' : ''}`}
      style={{ width: size, height: size }}
      title={abbr}
    >
      <img
        src={url}
        alt={`${team?.full_name || team?.display_name || abbr} logo`}
        width={size - 6}
        height={size - 6}
        loading="lazy"
        onError={() => setFailed(true)}
        className="h-full w-full object-contain"
      />
    </div>
  )
}
