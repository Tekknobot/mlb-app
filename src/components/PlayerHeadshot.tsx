import { useState } from 'react'
import { playerHeadshotUrl } from '@/lib/mlb-assets'

export default function PlayerHeadshot({
  playerId,
  name,
  size = 72,
}: {
  playerId?: number
  name: string
  size?: number
}) {
  const [failed, setFailed] = useState(false)
  const url = playerHeadshotUrl(playerId)

  if (!url || failed) {
    return (
      <div
        className="inline-flex items-center justify-center rounded-2xl bg-outfield text-gray-200 font-semibold"
        style={{ width: size, height: size }}
      >
        {name.split(/\s+/).map(s => s[0]).join('').slice(0, 2).toUpperCase() || 'PL'}
      </div>
    )
  }

  return (
    <img
      src={url}
      alt={`${name} headshot`}
      width={size}
      height={size}
      loading="lazy"
      onError={() => setFailed(true)}
      className="rounded-2xl bg-white/95 object-cover"
      style={{ width: size, height: size }}
    />
  )
}
