import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/LoginView.vue'),
    meta: { public: true }
  },
  {
    path: '/',
    component: () => import('@/components/layout/AppShell.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: '/dashboard'
      },
      {
        path: '/dashboard',
        name: 'Dashboard',
        component: () => import('@/views/DashboardView.vue'),
        meta: { title: 'Dashboard', icon: '📊' }
      },
      {
        path: '/particulars',
        name: 'Particulars',
        component: () => import('@/views/ParticularsView.vue'),
        meta: { title: 'Products', icon: '🏷️' }
      },
      {
        path: '/produce',
        name: 'Produce',
        component: () => import('@/views/ProduceView.vue'),
        meta: { title: 'Produce', icon: '🏭' }
      },
      {
        path: '/sales',
        name: 'Sales',
        component: () => import('@/views/SalesView.vue'),
        meta: { title: 'Sales', icon: '🛒' }
      },
      {
        path: '/inventory',
        name: 'Inventory',
        component: () => import('@/views/InventoryView.vue'),
        meta: { title: 'Inventory', icon: '📦' }
      },
      {
        path: '/reports',
        name: 'Reports',
        component: () => import('@/views/ReportsView.vue'),
        meta: { title: 'Reports', icon: '📈' }
      }
    ]
  },
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (!to.meta.public && !auth.currentUser) return { name: 'Login' }
  if (to.name === 'Login' && auth.currentUser) return { path: '/dashboard' }
})

export default router
