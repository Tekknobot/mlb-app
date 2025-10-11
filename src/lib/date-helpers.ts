import { format } from 'date-fns'

// "YYYY-MM-DD" in the user's local timezone
export const ymdLocal = (iso: string) => format(new Date(iso), 'yyyy-MM-dd')

// Nice label like "Fri, Oct 10" in local time
export const labelLocal = (iso: string) => format(new Date(iso), 'EEE, MMM d')

// Inclusive range check using local dates (YYYY-MM-DD compare)
export const inRangeLocal = (iso: string, startYmd: string, endYmd: string) => {
  const d = ymdLocal(iso)
  return d >= startYmd && d <= endYmd
}
