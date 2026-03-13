<template>
  <div class="stat-card">
    <div class="stat-label">{{ label }}</div>
    <div class="stat-val" :class="color">{{ value }}</div>
    <div v-if="sub" class="stat-sub">{{ sub }}</div>
  </div>
</template>

<script setup>
defineProps({
  label: String,
  value: [String, Number],
  color: { type: String, default: '' },
  sub: String
})
</script>

<style scoped>
.stat-sub { font-size: 11px; color: var(--muted); margin-top: 4px; }
</style>
