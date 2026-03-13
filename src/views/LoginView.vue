<template>
  <div class="login-screen">
    <div class="login-hero">
      <div class="login-logo">🥐 PerishTrack</div>
      <div class="login-tagline">Inventory & Sales for perishable goods</div>
    </div>

    <div class="login-card">
      <Transition name="fade" mode="out-in">
        <!-- Login Form -->
        <div v-if="!showRegister" key="login">
          <div class="login-card-title">Sign In</div>
          <div class="form-group">
            <label class="field-label">Username</label>
            <input
              class="field-input"
              v-model="loginForm.username"
              placeholder="e.g. maria"
              autocomplete="username"
              @keyup.enter="handleLogin"
            />
          </div>
          <div class="form-group">
            <label class="field-label">PIN / Password</label>
            <input
              class="field-input"
              type="password"
              v-model="loginForm.password"
              placeholder="••••"
              autocomplete="current-password"
              @keyup.enter="handleLogin"
            />
          </div>
          <p v-if="loginError" class="form-error">{{ loginError }}</p>
          <button class="btn btn-primary btn-block" @click="handleLogin">Sign In</button>
          <p class="login-switch">
            No account?
            <button class="link-btn" @click="showRegister = true">Create staff account</button>
          </p>
          <p class="demo-hint">Demo: <strong>admin</strong> / <strong>1234</strong></p>
        </div>

        <!-- Register Form -->
        <div v-else key="register">
          <div class="login-card-title">New Staff Account</div>
          <div class="form-group">
            <label class="field-label">Full Name</label>
            <input class="field-input" v-model="regForm.name" placeholder="Staff name" />
          </div>
          <div class="form-group">
            <label class="field-label">Username</label>
            <input class="field-input" v-model="regForm.username" placeholder="Login username" />
          </div>
          <div class="form-group">
            <label class="field-label">PIN / Password (min 4)</label>
            <input class="field-input" type="password" v-model="regForm.password" placeholder="••••" />
          </div>
          <p v-if="regError" class="form-error">{{ regError }}</p>
          <button class="btn btn-primary btn-block" @click="handleRegister">Create Account</button>
          <p class="login-switch">
            <button class="link-btn" @click="showRegister = false">← Back to Sign In</button>
          </p>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'

const auth   = useAuthStore()
const toast  = useToastStore()
const router = useRouter()

const showRegister = ref(false)
const loginError   = ref('')
const regError     = ref('')

const loginForm = reactive({ username: '', password: '' })
const regForm   = reactive({ name: '', username: '', password: '' })

function handleLogin() {
  loginError.value = ''
  const res = auth.login(loginForm.username, loginForm.password)
  if (!res.ok) { loginError.value = res.error; return }
  toast.success(`Welcome back, ${auth.currentUser.name}!`)
  router.push('/dashboard')
}

function handleRegister() {
  regError.value = ''
  const res = auth.register(regForm)
  if (!res.ok) { regError.value = res.error; return }
  toast.success('Account created! You can now sign in.')
  showRegister.value = false
  Object.assign(regForm, { name: '', username: '', password: '' })
}
</script>

<style scoped>
.login-screen {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 32px 20px;
  max-width: var(--max-w);
  margin: 0 auto;
}
.login-hero    { margin-bottom: 36px; }
.login-logo    { font-family: var(--font-head); font-size: 30px; font-weight: 800; color: var(--accent); }
.login-tagline { font-size: 14px; color: var(--muted); margin-top: 5px; }
.login-card    { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 24px 20px; }
.login-card-title { font-family: var(--font-head); font-size: 18px; font-weight: 700; margin-bottom: 18px; }
.form-error    { color: var(--red); font-size: 13px; margin-bottom: 12px; margin-top: -6px; }
.login-switch  { text-align: center; font-size: 13px; color: var(--muted); margin-top: 14px; }
.link-btn      { background: none; border: none; color: var(--accent); cursor: pointer; font-size: 13px; font-family: var(--font-body); text-decoration: underline; }
.demo-hint     { text-align: center; font-size: 11px; color: var(--muted); margin-top: 8px; }
</style>
