<template>
  <RouterView />
  <!-- Global Toast Container -->
  <div class="toast-wrap">
    <TransitionGroup name="fade">
      <div
        v-for="t in toastStore.toasts"
        :key="t.id"
        :class="['toast', t.type]"
        @click="toastStore.dismiss(t.id)"
      >
        {{ t.message }}
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup>
import { RouterView } from 'vue-router'
import { useToastStore } from '@/stores/toast'
const toastStore = useToastStore()
</script>
