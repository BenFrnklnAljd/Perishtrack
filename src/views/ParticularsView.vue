<template>
  <div class="page">
    <div class="page-title">Particulars</div>
    <div class="page-subtitle">Manage products & pricing</div>

    <!-- Add / Edit Form -->
    <div class="add-panel">
      <div class="add-panel-title">
        {{ editing ? '✏️ Edit Product' : '+ Add Product' }}
      </div>

      <div class="form-group">
        <label class="field-label">Product Name</label>
        <input
          class="field-input"
          v-model="form.name"
          placeholder="e.g. Pandesal, Espresso"
        />
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="field-label">Category</label>
          <select class="field-input" v-model="form.category">
            <option value="food">🍞 Food</option>
            <option value="beverage">☕ Beverage</option>
          </select>
        </div>
        <div class="form-group">
          <label class="field-label">Unit Price (₱)</label>
          <input
            class="field-input"
            type="number"
            v-model="form.price"
            placeholder="0.00"
            min="0"
          />
        </div>
      </div>

      <div v-if="formError" class="form-error">{{ formError }}</div>

      <div class="panel-actions">
        <button class="btn btn-primary btn-sm" @click="save">
          {{ editing ? 'Update Product' : 'Add Product' }}
        </button>
        <button v-if="editing" class="btn btn-ghost btn-sm" @click="cancelEdit">
          Cancel
        </button>
      </div>
    </div>

    <!-- Product List -->
    <div class="section-heading">All Products ({{ inv.products.length }})</div>

    <div v-if="inv.products.length === 0" class="empty-state">
      <div class="empty-icon">🏷️</div>
      <div class="empty-text">No products yet. Add your first product above.</div>
    </div>

    <TransitionGroup name="fade">
      <div
        v-for="p in inv.products"
        :key="p.id"
        class="product-card"
        :class="{ inactive: !p.active }"
      >
        <div class="product-top">
          <div class="product-name">{{ p.name }}</div>
          <span v-if="!p.active" class="tag tag-inactive">Inactive</span>
        </div>

        <div class="product-meta">
          <span :class="p.category === 'food' ? 'tag tag-food' : 'tag tag-bev'">
            {{ p.category === 'food' ? '🍞 Food' : '☕ Beverage' }}
          </span>
          <span class="price-tag">₱{{ p.price }}</span>
          <span class="date-meta">Added {{ p.createdAt }}</span>
        </div>

        <!-- Balance indicator -->
        <div class="product-bal">
          <span class="bal-label">Current Balance</span>
          <span
            class="bal-val"
            :class="inv.isExpired(p.id) ? 'text-red' : inv.currentBalance(p.id) > 0 ? 'text-green' : 'text-muted'"
          >
            {{ inv.currentBalance(p.id) }} units
          </span>
        </div>

        <div class="product-actions">
          <button class="btn btn-ghost btn-xs" @click="startEdit(p)">✏️ Edit</button>
          <button class="btn btn-ghost btn-xs" @click="toggleActive(p)">
            {{ p.active ? '🚫 Deactivate' : '✅ Activate' }}
          </button>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useInventoryStore } from '@/stores/inventory'
import { useToastStore } from '@/stores/toast'

const inv   = useInventoryStore()
const toast = useToastStore()

const editing   = ref(null)
const formError = ref('')

const form = reactive({ name: '', category: 'food', price: '' })

function save() {
  formError.value = ''
  if (!form.name.trim()) { formError.value = 'Product name is required.'; return }
  if (!form.price || parseFloat(form.price) <= 0) { formError.value = 'Enter a valid price.'; return }

  if (editing.value) {
    inv.updateProduct(editing.value.id, { ...form })
    toast.success('Product updated.')
    cancelEdit()
  } else {
    inv.addProduct({ ...form })
    toast.success('Product added!')
    Object.assign(form, { name: '', category: 'food', price: '' })
  }
}

function startEdit(p) {
  editing.value = p
  Object.assign(form, { name: p.name, category: p.category, price: p.price })
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function cancelEdit() {
  editing.value = null
  formError.value = ''
  Object.assign(form, { name: '', category: 'food', price: '' })
}

function toggleActive(p) {
  if (p.active && inv.productHasTransactions(p.id)) {
    inv.toggleProductActive(p.id)
    toast.info('Product deactivated. History is preserved.')
    return
  }
  inv.toggleProductActive(p.id)
  toast.success(p.active ? 'Product deactivated.' : 'Product activated.')
}
</script>

<style scoped>
.form-error {
  color: var(--red);
  font-size: 13px;
  margin-bottom: 10px;
  margin-top: -6px;
}

.product-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 14px 16px;
  margin-bottom: 10px;
  transition: opacity .2s, border-color .2s;
}
.product-card.inactive { opacity: .55; }

.product-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}
.product-name {
  font-weight: 600;
  font-size: 16px;
}
.product-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}
.product-bal {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--surface2);
  border-radius: var(--radius-xs);
  padding: 7px 12px;
  margin-bottom: 10px;
}
.bal-label { font-size: 12px; color: var(--muted); }
.bal-val   { font-family: var(--font-head); font-size: 14px; font-weight: 700; }

.product-actions { display: flex; gap: 8px; }
</style>
