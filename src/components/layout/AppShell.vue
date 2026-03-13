<template>
  <div class="app-shell">
    <!-- Top Bar -->
    <header class="top-bar">
      <div class="top-bar-left">
        <span class="top-bar-logo">🥐</span>
        <span class="top-bar-title">PerishTrack</span>
      </div>
      <div class="top-bar-right">
        <span class="top-bar-user">{{ auth.currentUser?.name }}</span>
        <button class="logout-btn" @click="handleLogout">Logout</button>
      </div>
    </header>

    <!-- Expiry Alerts -->
    <TransitionGroup name="fade">
      <div
        v-for="alert in inv.expiryAlerts"
        :key="alert.productId"
        class="alert-banner"
      >
        <div class="alert-icon">⚠️</div>
        <div class="alert-body">
          <div class="alert-title">Expiry Alert: {{ alert.name }}</div>
          <div class="alert-desc">{{ alert.units }} units are {{ alert.daysOld }}+ days old — marked as pullout/loss</div>
        </div>
      </div>
    </TransitionGroup>

    <!-- Page Content -->
    <main class="shell-main">
      <RouterView v-slot="{ Component }">
        <Transition name="fade" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>

    <!-- Bottom Navigation -->
    <nav class="bottom-nav">
      <RouterLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="nav-item"
        active-class="active"
      >
        <span class="nav-icon">{{ item.icon }}</span>
        <span class="nav-label">{{ item.label }}</span>
      </RouterLink>
    </nav>
  </div>
</template>

<script setup>
import { RouterView, RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useInventoryStore } from '@/stores/inventory'
import { useToastStore } from '@/stores/toast'

const auth    = useAuthStore()
const inv     = useInventoryStore()
const toast   = useToastStore()
const router  = useRouter()

const navItems = [
  { to: '/dashboard',   icon: '📊', label: 'Home'      },
  { to: '/particulars', icon: '🏷️', label: 'Products'  },
  { to: '/produce',     icon: '🏭', label: 'Produce'   },
  { to: '/sales',       icon: '🛒', label: 'Sales'     },
  { to: '/inventory',   icon: '📦', label: 'Stock'     },
  { to: '/reports',     icon: '📈', label: 'Reports'   },
]

function handleLogout() {
  auth.logout()
  toast.info('Logged out.')
  router.push('/login')
}
</script>

<style scoped>
.app-shell {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  max-width: var(--max-w);
  margin: 0 auto;
}

/* Top Bar */
.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  height: var(--top-h);
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 100;
  flex-shrink: 0;
}
.top-bar-left  { display: flex; align-items: center; gap: 8px; }
.top-bar-logo  { font-size: 22px; }
.top-bar-title { font-family: var(--font-head); font-size: 17px; font-weight: 800; color: var(--accent); }
.top-bar-right { display: flex; align-items: center; gap: 12px; }
.top-bar-user  { font-size: 12px; color: var(--muted); }
.logout-btn    { font-size: 12px; color: var(--muted); background: none; border: none; cursor: pointer; text-decoration: underline; font-family: var(--font-body); }

/* Main */
.shell-main { flex: 1; overflow-y: auto; }

/* Bottom Nav */
.bottom-nav {
  display: flex;
  background: var(--surface);
  border-top: 1px solid var(--border);
  position: sticky;
  bottom: 0;
  z-index: 100;
  flex-shrink: 0;
}
.nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 9px 4px 12px;
  gap: 3px;
  cursor: pointer;
  color: var(--muted);
  text-decoration: none;
  transition: color .18s;
}
.nav-item.active { color: var(--accent); }
.nav-icon  { font-size: 19px; line-height: 1; }
.nav-label { font-size: 9px; font-weight: 500; letter-spacing: .05em; text-transform: uppercase; }
</style>
