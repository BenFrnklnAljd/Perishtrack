import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { STORAGE_KEYS, loadArray, saveData, uid } from '@/utils/storage'
import { today, daysDiff, EXPIRY_DAYS } from '@/utils/date'

export const useInventoryStore = defineStore('inventory', () => {
  // ─── Raw Data ───────────────────────────────────────────────────────────────
  const products    = ref(loadArray(STORAGE_KEYS.PRODUCTS))
  const productions = ref(loadArray(STORAGE_KEYS.PRODUCTIONS))
  const sales       = ref(loadArray(STORAGE_KEYS.SALES))

  // ─── Persist ────────────────────────────────────────────────────────────────
  watch(products,    v => saveData(STORAGE_KEYS.PRODUCTS, v),    { deep: true })
  watch(productions, v => saveData(STORAGE_KEYS.PRODUCTIONS, v), { deep: true })
  watch(sales,       v => saveData(STORAGE_KEYS.SALES, v),       { deep: true })

  // ─── Helpers ────────────────────────────────────────────────────────────────
  const activeProducts   = computed(() => products.value.filter(p => p.active))
  const sortedProductions = computed(() => [...productions.value].sort((a,b) => b.date.localeCompare(a.date)))
  const sortedSales       = computed(() => [...sales.value].sort((a,b) => b.date.localeCompare(a.date)))

  const getProduct   = (id) => products.value.find(p => p.id === id)
  const productName  = (id) => getProduct(id)?.name  || 'Unknown'
  const productPrice = (id) => getProduct(id)?.price || 0

  // ─── Inventory Calculations ─────────────────────────────────────────────────
  const totalProduced = (pid) =>
    productions.value.filter(p => p.productId === pid).reduce((s, p) => s + p.qty, 0)

  const totalSold = (pid) =>
    sales.value.filter(s => s.productId === pid).reduce((s, x) => s + x.qty, 0)

  const expiredUnits = (pid) => {
    const expiredBatches = productions.value.filter(
      p => p.productId === pid && daysDiff(p.date) > EXPIRY_DAYS
    )
    return expiredBatches.reduce((sum, batch) => {
      const soldAfter = sales.value
        .filter(s => s.productId === pid && s.date >= batch.date)
        .reduce((a, b) => a + b.qty, 0)
      return sum + Math.max(0, batch.qty - soldAfter)
    }, 0)
  }

  const currentBalance = (pid) =>
    Math.max(0, totalProduced(pid) - totalSold(pid) - expiredUnits(pid))

  const isExpired = (pid) => expiredUnits(pid) > 0

  // ─── Expiry Alerts ──────────────────────────────────────────────────────────
  const expiryAlerts = computed(() =>
    activeProducts.value
      .filter(p => isExpired(p.id))
      .map(p => {
        const oldest = productions.value
          .filter(x => x.productId === p.id)
          .sort((a, b) => a.date.localeCompare(b.date))[0]
        return {
          productId: p.id,
          name:      p.name,
          units:     expiredUnits(p.id),
          daysOld:   oldest ? daysDiff(oldest.date) : 0
        }
      })
  )

  // ─── Loss ───────────────────────────────────────────────────────────────────
  const totalExpiredUnits = computed(() =>
    activeProducts.value.reduce((s, p) => s + expiredUnits(p.id), 0)
  )
  const totalLossValue = computed(() =>
    activeProducts.value.reduce((s, p) => s + expiredUnits(p.id) * productPrice(p.id), 0)
  )

  // ─── Today ──────────────────────────────────────────────────────────────────
  const todaySales = computed(() => sales.value.filter(s => s.date === today()))
  const todayRevenue = computed(() => todaySales.value.reduce((s, x) => s + x.qty * x.price, 0))
  const todayUnitsSold = computed(() => todaySales.value.reduce((s, x) => s + x.qty, 0))
  const todayProfit = computed(() => todayRevenue.value - totalLossValue.value)

  // ─── Report helpers ─────────────────────────────────────────────────────────
  function getFilteredSales({ period, productId }) {
    return sales.value.filter(s => {
      if (productId && s.productId !== productId) return false
      if (period === 'daily')   return s.date === today()
      if (period === 'weekly')  return daysDiff(s.date) <= 6
      if (period === 'monthly') {
        const d = new Date(s.date), now = new Date()
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      }
      return true
    })
  }

  function getSalesByProduct(filteredSales) {
    const map = {}
    filteredSales.forEach(s => {
      map[s.productId] = (map[s.productId] || 0) + s.qty * s.price
    })
    const arr = Object.entries(map).map(([id, revenue]) => ({
      id, name: productName(id), revenue
    }))
    const max = Math.max(...arr.map(x => x.revenue), 1)
    return arr.map(x => ({ ...x, pct: Math.round((x.revenue / max) * 100) }))
              .sort((a, b) => b.revenue - a.revenue)
  }

  // ─── CRUD – Products ────────────────────────────────────────────────────────
  function addProduct({ name, category, price }) {
    products.value.push({ id: uid(), name, category, price: parseFloat(price), active: true, createdAt: today() })
  }
  function updateProduct(id, data) {
    const idx = products.value.findIndex(p => p.id === id)
    if (idx !== -1) products.value[idx] = { ...products.value[idx], ...data, price: parseFloat(data.price) }
  }
  function toggleProductActive(id) {
    const p = products.value.find(x => x.id === id)
    if (p) p.active = !p.active
  }
  function productHasTransactions(id) {
    return productions.value.some(x => x.productId === id) || sales.value.some(x => x.productId === id)
  }

  // ─── CRUD – Productions ─────────────────────────────────────────────────────
  function addProduction({ productId, qty, date, notes, staffName }) {
    productions.value.push({ id: uid(), productId, qty: parseInt(qty), date, notes: notes || '', staffName, createdAt: new Date().toISOString() })
  }
  function updateProduction(id, data) {
    const idx = productions.value.findIndex(p => p.id === id)
    if (idx !== -1) productions.value[idx] = { ...productions.value[idx], ...data, qty: parseInt(data.qty) }
  }
  function deleteProduction(id) {
    const idx = productions.value.findIndex(p => p.id === id)
    if (idx !== -1) productions.value.splice(idx, 1)
  }

  // ─── CRUD – Sales ────────────────────────────────────────────────────────────
  function addSale({ productId, qty, price, date, staffName }) {
    sales.value.push({ id: uid(), productId, qty: parseInt(qty), price: parseFloat(price), date, staffName, createdAt: new Date().toISOString() })
  }
  function deleteSale(id) {
    const idx = sales.value.findIndex(s => s.id === id)
    if (idx !== -1) sales.value.splice(idx, 1)
  }

  return {
    products, productions, sales,
    activeProducts, sortedProductions, sortedSales,
    getProduct, productName, productPrice,
    totalProduced, totalSold, expiredUnits, currentBalance, isExpired,
    expiryAlerts, totalExpiredUnits, totalLossValue,
    todaySales, todayRevenue, todayUnitsSold, todayProfit,
    getFilteredSales, getSalesByProduct,
    addProduct, updateProduct, toggleProductActive, productHasTransactions,
    addProduction, updateProduction, deleteProduction,
    addSale, deleteSale
  }
})
