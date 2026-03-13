<template>
  <div class="page">
    <div class="page-title">Sales</div>
    <div class="page-subtitle">Record transactions</div>

    <!-- Sale Form -->
    <div class="add-panel">
      <div class="add-panel-title">+ New Sale</div>

      <div class="form-group">
        <label class="field-label">Product</label>
        <select class="field-input" v-model="form.productId" @change="onProductChange">
          <option value="">Select product…</option>
          <option
            v-for="p in inv.activeProducts"
            :key="p.id"
            :value="p.id"
            :disabled="inv.currentBalance(p.id) === 0"
          >
            {{ p.name }} — bal: {{ inv.currentBalance(p.id) }}
          </option>
        </select>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="field-label">Qty Sold</label>
          <input
            class="field-input"
            type="number"
            v-model="form.qty"
            placeholder="0"
            min="1"
          />
        </div>
        <div class="form-group">
          <label class="field-label">Unit Price (₱)</label>
          <input
            class="field-input"
            type="number"
            v-model="form.price"
            placeholder="auto"
          />
        </div>
      </div>

      <div class="form-group">
        <label class="field-label">Sale Date</label>
        <input class="field-input" type="date" v-model="form.date" />
      </div>

      <!-- Live total preview -->
      <div v-if="form.productId && form.qty && form.price" class="total-preview">
        <span>Total Amount</span>
        <span class="total-amount">₱{{ (form.qty * form.price).toFixed(2) }}</span>
      </div>

      <div v-if="formError" class="form-error">{{ formError }}</div>

      <button class="btn btn-primary btn-block" @click="recordSale">
        ✅ Record Sale
      </button>
    </div>

    <!-- Today's Receipt -->
    <div v-if="inv.todaySales.length > 0" class="receipt" style="margin-bottom: 16px">
      <div class="receipt-header">
        <div class="receipt-logo">🥐 PerishTrack</div>
        <div class="receipt-meta">{{ todayLabel() }}</div>
        <div class="receipt-meta">Staff: {{ auth.currentUser?.name }}</div>
      </div>
      <div v-for="s in inv.todaySales" :key="s.id" class="receipt-line">
        <span>{{ inv.productName(s.productId) }} × {{ s.qty }}</span>
        <span>₱{{ (s.qty * s.price).toFixed(2) }}</span>
      </div>
      <div class="receipt-total">
        <span>TOTAL</span>
        <span>₱{{ inv.todayRevenue.toFixed(2) }}</span>
      </div>
      <button
        class="btn btn-ghost btn-sm btn-block"
        style="margin-top:12px"
        @click="downloadReceipt"
      >
        📄 Download Receipt PDF
      </button>
    </div>

    <!-- All Sales History -->
    <div class="section-heading">Sales History ({{ inv.sales.length }})</div>

    <div v-if="inv.sales.length === 0" class="empty-state">
      <div class="empty-icon">🛒</div>
      <div class="empty-text">No sales recorded yet.</div>
    </div>

    <TransitionGroup name="fade">
      <div v-for="s in inv.sortedSales" :key="s.id" class="sale-card">
        <div class="sale-top">
          <div>
            <div class="sale-name">{{ inv.productName(s.productId) }}</div>
            <div class="date-meta">{{ s.date }} · {{ s.staffName }}</div>
          </div>
          <div class="sale-amount">
            <div class="amount-val">₱{{ (s.qty * s.price).toFixed(2) }}</div>
            <div class="amount-meta">{{ s.qty }} × ₱{{ s.price }}</div>
          </div>
        </div>
        <div class="sale-actions">
          <button
            class="btn btn-xs"
            style="background:var(--red-dim);color:var(--red);border:none"
            @click="confirmDelete(s)"
          >
            🗑 Delete
          </button>
        </div>
      </div>
    </TransitionGroup>

    <!-- Delete Confirm Modal -->
    <BaseModal v-model="showDeleteModal" title="Delete Sale?">
      <p style="font-size:14px;color:var(--text2);margin-bottom:20px">
        Delete this sale of
        <strong>{{ deleteTarget?.qty }} × {{ inv.productName(deleteTarget?.productId) }}</strong>?
        Inventory balance will be restored.
      </p>
      <div class="panel-actions">
        <button class="btn btn-danger btn-sm" @click="doDelete">Delete</button>
        <button class="btn btn-ghost btn-sm" @click="showDeleteModal = false">Cancel</button>
      </div>
    </BaseModal>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useInventoryStore } from '@/stores/inventory'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import { today, todayLabel } from '@/utils/date'
import { usePdf } from '@/composables/usePdf'
import BaseModal from '@/components/ui/BaseModal.vue'

const inv   = useInventoryStore()
const auth  = useAuthStore()
const toast = useToastStore()
const { exportReceipt } = usePdf()

const formError       = ref('')
const showDeleteModal = ref(false)
const deleteTarget    = ref(null)

const form = reactive({
  productId: '',
  qty: '',
  price: '',
  date: today()
})

function onProductChange() {
  const p = inv.getProduct(form.productId)
  if (p) form.price = p.price
}

function recordSale() {
  formError.value = ''
  if (!form.productId) { formError.value = 'Select a product.'; return }
  if (!form.qty || parseInt(form.qty) < 1) { formError.value = 'Enter a valid quantity.'; return }
  if (!form.price || parseFloat(form.price) <= 0) { formError.value = 'Enter a valid price.'; return }

  const bal = inv.currentBalance(form.productId)
  if (parseInt(form.qty) > bal) {
    formError.value = `Only ${bal} units available in stock.`
    return
  }

  inv.addSale({ ...form, staffName: auth.currentUser.name })
  toast.success('Sale recorded!')
  Object.assign(form, { productId: '', qty: '', price: '', date: today() })
}

function downloadReceipt() {
  exportReceipt(inv.todaySales, auth.currentUser.name)
  toast.success('Receipt PDF downloaded.')
}

function confirmDelete(s) {
  deleteTarget.value = s
  showDeleteModal.value = true
}

function doDelete() {
  inv.deleteSale(deleteTarget.value.id)
  toast.info('Sale deleted. Balance restored.')
  showDeleteModal.value = false
  deleteTarget.value = null
}
</script>

<style scoped>
.form-error { color: var(--red); font-size: 13px; margin-bottom: 10px; margin-top: -6px; }

.total-preview {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--accent-dim);
  border: 1px solid rgba(245,166,35,.25);
  border-radius: var(--radius-xs);
  padding: 10px 14px;
  margin-bottom: 12px;
  font-size: 14px;
  color: var(--text2);
}
.total-amount {
  font-family: var(--font-head);
  font-size: 18px;
  font-weight: 800;
  color: var(--accent);
}

.sale-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 13px 16px;
  margin-bottom: 10px;
}
.sale-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}
.sale-name   { font-weight: 600; font-size: 15px; margin-bottom: 3px; }
.sale-amount { text-align: right; }
.amount-val  { font-family: var(--font-head); font-size: 17px; font-weight: 700; color: var(--accent); }
.amount-meta { font-size: 11px; color: var(--muted); margin-top: 2px; }
.sale-actions { display: flex; justify-content: flex-end; }
</style>
