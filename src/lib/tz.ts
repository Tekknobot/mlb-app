import { formatInTimeZone } from 'date-fns-tz'

// detect the user's IANA zone, fallback to Eastern
export const userTZ =
  Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York'

// "YYYY-MM-DD" for the given ISO timestamp in the chosen TZ
export const ymdInTZ = (iso: string, tz: string = userTZ) =>
  formatInTimeZone(iso, tz, 'yyyy-MM-dd')

// Friendly label like "Fri, Oct 10" in the chosen TZ
export const labelInTZ = (iso: string, tz: string = userTZ) =>
  formatInTimeZone(iso, tz, 'EEE, MMM d')

// Inclusive range check using *TZ-local* date (YYYY-MM-DD)
export const inRangeInTZ = (iso: string, startYmd: string, endYmd: string, tz: string = userTZ) => {
  const d = ymdInTZ(iso, tz)
  return d >= startYmd && d <= endYmd
}
