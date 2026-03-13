// ─── LocalStorage helpers ───────────────────────────────────────────────────

export const STORAGE_KEYS = {
  USERS: 'pt_users',
  PRODUCTS: 'pt_products',
  PRODUCTIONS: 'pt_productions',
  SALES: 'pt_sales',
  SESSION: 'pt_session'
}

export function loadArray(key) {
  try { return JSON.parse(localStorage.getItem(key)) || [] }
  catch { return [] }
}

export function loadItem(key) {
  try { return JSON.parse(localStorage.getItem(key)) }
  catch { return null }
}

export function saveData(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function removeData(key) {
  localStorage.removeItem(key)
}

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}
