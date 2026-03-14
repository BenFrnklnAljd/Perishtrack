<template>
  <div class="page">
    <div class="page-title">Production Log</div>
    <div class="page-subtitle">Record daily batches</div>

    <!-- Add / Edit Form -->
    <div class="add-panel">
      <div class="add-panel-title">
        {{ editing ? '✏️ Edit Entry' : '+ Log Production' }}
      </div>

      <div class="form-group">
        <label class="field-label">Product</label>
        <select class="field-input" v-model="form.productId">
          <option value="">Select product…</option>
          <option v-for="p in inv.activeProducts" :key="p.id" :value="p.id">
            {{ p.name }}
          </option>
        </select>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="field-label">Qty Produced</label>
          <input
            class="field-input"
            type="number"
            v-model="form.qty"
            placeholder="0"
            min="1"
          />
        </div>
        <div class="form-group">
          <label class="field-label">Production Date</label>
          <input class="field-input" type="date" v-model="form.date" />
        </div>
      </div>

      

      <div v-if="formError" class="form-error">{{ formError }}</div>

      <div class="panel-actions">
        <button class="btn btn-primary btn-sm" @click="save">
          {{ editing ? 'Update Entry' : 'Log Batch' }}
        </button>
        <button v-if="editing" class="btn btn-ghost btn-sm" @click="cancelEdit">
          Cancel
        </button>
      </div>
    </div>

    <!-- Log List -->
    <div class="section-heading">
      Production History ({{ inv.sortedProductions.length }})
    </div>

    <div v-if="inv.sortedProductions.length === 0" class="empty-state">
      <div class="empty-icon">🏭</div>
      <div class="empty-text">No production entries yet.<br/>Log your first batch above.</div>
    </div>

    <TransitionGroup name="fade">
      <div
        v-for="entry in inv.sortedProductions"
        :key="entry.id"
        class="prod-card"
      >
        <div class="prod-top">
          <div>
            <div class="prod-name">{{ inv.productName(entry.productId) }}</div>
            <div class="date-meta">{{ entry.date }} · by {{ entry.staffName }}</div>
          </div>
          <div class="prod-qty">
            <div class="qty-label">Qty</div>
            <div class="qty-val">{{ entry.qty }}</div>
          </div>
        </div>

        <div v-if="entry.notes" class="prod-notes">{{ entry.notes }}</div>

        <div class="prod-footer">
          <span v-if="inv.isPerishable(entry.productId)" :class="['tag', expiryTagClass(entry.date)]">
            {{ expiryLabel(entry.date) }}
          </span>
          <span v-else class="tag tag-bev">No Expiry</span>
          <div class="prod-actions">
            <button class="btn btn-ghost btn-xs" @click="startEdit(entry)">Edit</button>
            <button
              class="btn btn-xs"
              style="background:var(--red-dim);color:var(--red);border:none"
              @click="confirmDelete(entry)"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </TransitionGroup>

    <!-- Delete Confirm Modal -->
    <BaseModal v-model="showDeleteModal" title="Delete Entry?">
      <p style="font-size:14px;color:var(--text2);margin-bottom:20px">
        This will remove the production entry for
        <strong>{{ deleteTarget?.qty }} units of {{ inv.productName(deleteTarget?.productId) }}</strong>.
        This action cannot be undone.
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
import { today, expiryLabel, expiryTagClass } from '@/utils/date'
import BaseModal from '@/components/ui/BaseModal.vue'

const inv   = useInventoryStore()
const auth  = useAuthStore()
const toast = useToastStore()

const editing         = ref(null)
const formError       = ref('')
const showDeleteModal = ref(false)
const deleteTarget    = ref(null)

const form = reactive({
  productId: '',
  qty: '',
  date: today(),
  notes: ''
})

function save() {
  formError.value = ''
  if (!form.productId) { formError.value = 'Select a product.'; return }
  if (!form.qty || parseInt(form.qty) < 1) { formError.value = 'Enter a valid quantity.'; return }
  if (!form.date) { formError.value = 'Select a production date.'; return }

  if (editing.value) {
    inv.updateProduction(editing.value.id, { ...form })
    toast.success('Production entry updated.')
    cancelEdit()
  } else {
    inv.addProduction({ ...form, staffName: auth.currentUser.name })
    toast.success('Batch logged!')
    Object.assign(form, { productId: '', qty: '', date: today(), notes: '' })
  }
}

function startEdit(entry) {
  editing.value = entry
  Object.assign(form, {
    productId: entry.productId,
    qty: entry.qty,
    date: entry.date,
    notes: entry.notes
  })
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function cancelEdit() {
  editing.value = null
  formError.value = ''
  Object.assign(form, { productId: '', qty: '', date: today(), notes: '' })
}

function confirmDelete(entry) {
  deleteTarget.value = entry
  showDeleteModal.value = true
}

function doDelete() {
  inv.deleteProduction(deleteTarget.value.id)
  toast.info('Entry deleted.')
  showDeleteModal.value = false
  deleteTarget.value = null
}
</script>

<style scoped>
.form-error { color: var(--red); font-size: 13px; margin-bottom: 10px; margin-top: -6px; }

.prod-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 14px 16px;
  margin-bottom: 10px;
}
.prod-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}
.prod-name  { font-weight: 600; font-size: 15px; margin-bottom: 3px; }
.prod-qty   { text-align: right; }
.qty-label  { font-size: 10px; color: var(--muted); text-transform: uppercase; letter-spacing: .06em; }
.qty-val    { font-family: var(--font-head); font-size: 24px; font-weight: 800; line-height: 1; }
.prod-notes { font-size: 12px; color: var(--muted); margin-bottom: 10px; padding: 6px 10px; background: var(--surface2); border-radius: var(--radius-xs); }
.prod-footer { display: flex; justify-content: space-between; align-items: center; }
.prod-actions { display: flex; gap: 6px; }
</style>
