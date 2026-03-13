<template>
  <div class="page">
    <div class="page-title">Inventory</div>
    <div class="page-subtitle">Balance = Prev + Produced − Sold − Expired</div>

    <!-- Summary Tiles -->
    <div class="stats-grid" style="margin-bottom:20px">
      <StatCard
        label="Total Products"
        :value="inv.activeProducts.length"
      />
      <StatCard
        label="Items In Stock"
        :value="totalInStock"
        color="text-green"
      />
      <StatCard
        label="Expired Units"
        :value="inv.totalExpiredUnits"
        color="text-red"
      />
      <StatCard
        label="Loss Value"
        :value="'₱' + inv.totalLossValue.toFixed(2)"
        color="text-red"
      />
    </div>

    <!-- Filter -->
    <div class="form-group">
      <label class="field-label">Filter by Category</label>
      <select class="field-input" v-model="filterCat">
        <option value="">All Categories</option>
        <option value="food">🍞 Food</option>
        <option value="beverage">☕ Beverage</option>
      </select>
    </div>

    <!-- Inventory Table -->
    <div v-if="filteredProducts.length === 0" class="empty-state">
      <div class="empty-icon">📋</div>
      <div class="empty-text">No active products found.</div>
    </div>

    <div v-else class="inv-table">
      <div class="inv-thead">
        <span>Product</span>
        <span style="text-align:center">Prod.</span>
        <span style="text-align:center">Sold</span>
        <span style="text-align:center">Exp.</span>
        <span style="text-align:center">Bal.</span>
      </div>
      <div
        v-for="p in filteredProducts"
        :key="p.id"
        :class="['inv-row', inv.isExpired(p.id) ? 'expired' : '']"
        @click="selectProduct(p)"
      >
        <div class="inv-cell">
          <span class="inv-name">{{ p.name }}</span>
        </div>
        <div class="inv-cell center">{{ inv.totalProduced(p.id) }}</div>
        <div class="inv-cell center">{{ inv.totalSold(p.id) }}</div>
        <div class="inv-cell center" style="color:var(--red)">{{ inv.expiredUnits(p.id) }}</div>
        <div class="inv-cell center">
          <span
            class="inv-num"
            :class="inv.isExpired(p.id) ? 'text-red' : inv.currentBalance(p.id) > 0 ? 'text-green' : 'text-muted'"
          >
            {{ inv.currentBalance(p.id) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Product Detail Drawer -->
    <BaseModal v-model="showDetail" :title="selected?.name">
      <div v-if="selected">
        <!-- Tags -->
        <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap">
          <span :class="selected.category === 'food' ? 'tag tag-food' : 'tag tag-bev'">{{ selected.category }}</span>
          <span class="price-tag">₱{{ selected.price }} / unit</span>
          <span v-if="inv.isExpired(selected.id)" class="tag tag-expired">Pullout</span>
          <span v-else class="tag tag-ok">Active</span>
        </div>

        <!-- Detail Rows -->
        <div class="detail-grid">
          <div class="detail-row">
            <span class="detail-label">Total Produced</span>
            <span class="detail-val">{{ inv.totalProduced(selected.id) }} units</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Total Sold</span>
            <span class="detail-val">{{ inv.totalSold(selected.id) }} units</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Expired / Pullout</span>
            <span class="detail-val text-red">{{ inv.expiredUnits(selected.id) }} units</span>
          </div>
          <div class="detail-row" style="border-top:1px solid var(--border);padding-top:10px;margin-top:4px">
            <span class="detail-label" style="font-weight:600">Current Balance</span>
            <span
              class="detail-val"
              style="font-size:20px"
              :class="inv.currentBalance(selected.id) > 0 ? 'text-green' : 'text-muted'"
            >
              {{ inv.currentBalance(selected.id) }} units
            </span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Loss Value</span>
            <span class="detail-val text-red">
              ₱{{ (inv.expiredUnits(selected.id) * selected.price).toFixed(2) }}
            </span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Revenue Generated</span>
            <span class="detail-val text-green">
              ₱{{ productRevenue(selected.id).toFixed(2) }}
            </span>
          </div>
        </div>

        <!-- Production Batches -->
        <div class="section-heading" style="margin-top:16px">Recent Batches</div>
        <div
          v-for="batch in recentBatches(selected.id)"
          :key="batch.id"
          class="batch-row"
        >
          <span class="date-meta">{{ batch.date }}</span>
          <span style="font-weight:500">{{ batch.qty }} units</span>
          <span :class="['tag', expiryTagClass(batch.date)]" style="font-size:10px">
            {{ expiryLabel(batch.date) }}
          </span>
        </div>
        <div v-if="recentBatches(selected.id).length === 0" style="font-size:13px;color:var(--muted)">No production entries.</div>

        <button class="btn btn-ghost btn-block" style="margin-top:16px" @click="showDetail = false">Close</button>
      </div>
    </BaseModal>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useInventoryStore } from '@/stores/inventory'
import { expiryLabel, expiryTagClass } from '@/utils/date'
import StatCard from '@/components/ui/StatCard.vue'
import BaseModal from '@/components/ui/BaseModal.vue'

const inv = useInventoryStore()

const filterCat  = ref('')
const showDetail = ref(false)
const selected   = ref(null)

const filteredProducts = computed(() =>
  inv.activeProducts.filter(p => !filterCat.value || p.category === filterCat.value)
)

const totalInStock = computed(() =>
  inv.activeProducts.reduce((s, p) => s + inv.currentBalance(p.id), 0)
)

function selectProduct(p) {
  selected.value = p
  showDetail.value = true
}

function productRevenue(pid) {
  return inv.sales
    .filter(s => s.productId === pid)
    .reduce((s, x) => s + x.qty * x.price, 0)
}

function recentBatches(pid) {
  return inv.productions
    .filter(p => p.productId === pid)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5)
}
</script>

<style scoped>
.detail-grid { display: flex; flex-direction: column; gap: 0; }
.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid var(--border);
}
.detail-label { font-size: 13px; color: var(--text2); }
.detail-val   { font-family: var(--font-head); font-weight: 700; font-size: 15px; }

.batch-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 0;
  border-bottom: 1px solid var(--border);
  font-size: 13px;
}
</style>
