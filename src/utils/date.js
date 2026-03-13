// ─── Date utilities ─────────────────────────────────────────────────────────

export const today = () => new Date().toISOString().slice(0, 10)

export const daysDiff = (dateStr) =>
  Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000)

export const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString('en-PH', {
    year: 'numeric', month: 'short', day: 'numeric'
  })

export const formatDateLong = (dateStr) =>
  new Date(dateStr).toLocaleDateString('en-PH', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })

export const todayLabel = () => formatDateLong(today())

export const isThisWeek = (dateStr) => daysDiff(dateStr) <= 6

export const isThisMonth = (dateStr) => {
  const d = new Date(dateStr), now = new Date()
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
}

export const EXPIRY_DAYS = 2

export const getExpiryStatus = (dateStr) => {
  const d = daysDiff(dateStr)
  if (d > EXPIRY_DAYS) return 'expired'
  if (d >= EXPIRY_DAYS) return 'expiring'
  if (d === 1) return 'day2'
  return 'fresh'
}

export const expiryLabel = (dateStr) => {
  const status = getExpiryStatus(dateStr)
  return { expired: 'Expired', expiring: 'Expiring', day2: 'Day 2', fresh: 'Fresh' }[status]
}

export const expiryTagClass = (dateStr) => {
  const status = getExpiryStatus(dateStr)
  return { expired: 'tag-expired', expiring: 'tag-warn', day2: 'tag-warn', fresh: 'tag-ok' }[status]
}
