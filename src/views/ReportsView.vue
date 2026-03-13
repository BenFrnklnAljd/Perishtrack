<template>
  <div class="page">
    <div class="page-title">Reports</div>
    <div class="page-subtitle">Analytics & exports</div>

    <!-- Period Selector -->
    <div class="period-tabs">
      <button
        v-for="p in periods"
        :key="p.value"
        :class="['period-btn', period === p.value ? 'active' : '']"
        @click="period = p.value"
      >
        {{ p.label }}
      </button>
    </div>

    <!-- Product Filter -->
    <div class="form-group">
      <label class="field-label">Filter by Product</label>
      <select class="field-input" v-model="productFilter">
        <option value="">All Products</option>
        <option v-for="p in inv.products" :key="p.id" :value="p.id">{{ p.name }}</option>
      </select>
    </div>

    <!-- Summary Stats -->
    <div class="stats-grid">
      <StatCard
        label="Revenue"
        :value="'₱' + stats.revenue.toFixed(2)"
        color="text-accent"
      />
      <StatCard
        label="Units Sold"
        :value="stats.units"
      />
      <StatCard
        label="Loss"
        :value="'₱' + stats.loss.toFixed(2)"
        color="text-red"
      />
      <StatCard
        label="Net Profit"
        :value="'₱' + stats.net.toFixed(2)"
        :color="stats.net >= 0 ? 'text-green' : 'text-red'"
      />
    </div>

    <!-- Profit indicator -->
    <div class="profit-row">
      <span class="profit-label">Profit / Loss Status</span>
      <span :class="['profit-badge', stats.net >= 0 ? 'pos' : 'neg']">
        {{ stats.net >= 0 ? '📈 Profitable' : '📉 At a Loss' }}
      </span>
    </div>

    <!-- Sales by Product Chart -->
    <div class="card" style="margin-bottom:12px">
      <div class="chart-title">Sales by Product</div>
      <div v-if="salesByProduct.length === 0" style="font-size:13px;color:var(--muted);padding:8px 0">
        No sales data for this period.
      </div>
      <div v-else class="bar-chart">
        <div v-for="item in salesByProduct" :key="item.id" class="bar-row">
          <div class="bar-label" :title="item.name">{{ item.name }}</div>
          <div class="bar-track">
            <div class="bar-fill sales" :style="{ width: item.pct + '%' }">
              {{ item.revenue > 0 ? '₱' + item.revenue.toFixed(0) : '' }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Sales Table -->
    <div class="card" style="margin-bottom:16px">
      <div class="chart-title">
        Sales Log
        <span class="log-count">({{ filteredSales.length }} entries)</span>
      </div>
      <div v-if="filteredSales.length === 0" style="font-size:13px;color:var(--muted);padding:8px 0">
        No sales in this period.
      </div>
      <div v-else>
        <div class="log-header">
          <span>Date</span>
          <span>Product</span>
          <span style="text-align:right">Amount</span>
        </div>
        <div
          v-for="s in filteredSales.slice().reverse()"
          :key="s.id"
          class="log-row"
        >
          <span class="log-date">{{ s.date }}</span>
          <span class="log-product">{{ inv.productName(s.productId) }}</span>
          <span class="log-amount">₱{{ (s.qty * s.price).toFixed(2) }}</span>
        </div>
      </div>
    </div>

    <!-- Export Buttons -->
    <div class="section-heading">Export</div>
    <div class="export-grid">
      <button class="btn btn-primary btn-block" :disabled="exporting" @click="handleExportPDF">
        {{ exporting ? '⏳ Generating…' : 'Export PDF Report' }}
      </button>
      <button class="btn btn-ghost btn-block" @click="showReceiptModal = true">
        🧾 View Digital Receipt
      </button>
    </div>

    <!-- Receipt Modal -->
    <BaseModal v-model="showReceiptModal" title="Today's Receipt">
      <div class="receipt">
        <div class="receipt-header">
          <div class="receipt-logo">🥐 PerishTrack</div>
          <div class="receipt-meta">{{ todayLabel() }}</div>
          <div class="receipt-meta">Staff: {{ auth.currentUser?.name }}</div>
        </div>
        <div v-if="inv.todaySales.length === 0" style="text-align:center;padding:20px;color:var(--muted);font-size:13px">
          No sales recorded today.
        </div>
        <div v-for="s in inv.todaySales" :key="s.id" class="receipt-line">
          <span>{{ inv.productName(s.productId) }} × {{ s.qty }}</span>
          <span>₱{{ (s.qty * s.price).toFixed(2) }}</span>
        </div>
        <div v-if="inv.todaySales.length > 0" class="receipt-total">
          <span>TOTAL</span>
          <span>₱{{ inv.todayRevenue.toFixed(2) }}</span>
        </div>
      </div>
      <button class="btn btn-ghost btn-block" style="margin-top:14px" @click="showReceiptModal = false">
        Close
      </button>
    </BaseModal>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useInventoryStore } from '@/stores/inventory'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import { todayLabel } from '@/utils/date'
import { usePdf } from '@/composables/usePdf'
import StatCard from '@/components/ui/StatCard.vue'
import BaseModal from '@/components/ui/BaseModal.vue'

const inv   = useInventoryStore()
const auth  = useAuthStore()
const toast = useToastStore()
const { exportReport } = usePdf()

const period          = ref('daily')
const productFilter   = ref('')
const showReceiptModal = ref(false)
const exporting       = ref(false)

const periods = [
  { value: 'daily',   label: 'Today'     },
  { value: 'weekly',  label: 'This Week' },
  { value: 'monthly', label: 'This Month'},
]

const filteredSales = computed(() =>
  inv.getFilteredSales({ period: period.value, productId: productFilter.value })
)

const stats = computed(() => {
  const revenue = filteredSales.value.reduce((s, x) => s + x.qty * x.price, 0)
  const units   = filteredSales.value.reduce((s, x) => s + x.qty, 0)
  const loss    = inv.totalLossValue
  return { revenue, units, loss, net: revenue - loss }
})

const salesByProduct = computed(() =>
  inv.getSalesByProduct(filteredSales.value)
)

async function handleExportPDF() {
  exporting.value = true
  try {
    await exportReport(period.value, productFilter.value)
    toast.success('PDF report downloaded!')
  } catch (e) {
    toast.error('Export failed. Please try again.')
    console.error(e)
  } finally {
    exporting.value = false
  }
}
</script>

<style scoped>
/* Period Tabs */
.period-tabs {
  display: flex;
  gap: 6px;
  margin-bottom: 16px;
}
.period-btn {
  flex: 1;
  padding: 10px 6px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: var(--surface2);
  color: var(--muted);
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all .18s;
}
.period-btn.active {
  background: var(--accent);
  border-color: var(--accent);
  color: #0f0e0c;
  font-weight: 700;
}

/* Profit row */
.profit-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 12px 16px;
  margin-bottom: 16px;
}
.profit-label { font-size: 14px; color: var(--text2); }

/* Chart */
.chart-title {
  font-family: var(--font-head);
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.log-count { font-size: 12px; color: var(--muted); font-family: var(--font-body); font-weight: 400; }

/* Sales Table */
.log-header {
  display: grid;
  grid-template-columns: 90px 1fr 80px;
  font-size: 10px;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: .07em;
  padding: 6px 0;
  border-bottom: 1px solid var(--border);
  margin-bottom: 4px;
}
.log-row {
  display: grid;
  grid-template-columns: 90px 1fr 80px;
  padding: 8px 0;
  border-bottom: 1px solid var(--border);
  font-size: 13px;
  align-items: center;
}
.log-date    { color: var(--muted); font-size: 11px; }
.log-product { font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.log-amount  { font-family: var(--font-head); font-weight: 700; font-size: 13px; color: var(--accent); text-align: right; }

/* Export */
.export-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 32px;
}
</style>
