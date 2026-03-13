import { defineStore } from 'pinia'
import { ref } from 'vue'
import { STORAGE_KEYS, loadArray, loadItem, saveData, removeData, uid } from '@/utils/storage'

export const useAuthStore = defineStore('auth', () => {
  const users = ref(loadArray(STORAGE_KEYS.USERS))
  const currentUser = ref(loadItem(STORAGE_KEYS.SESSION))

  // Seed default admin if no users exist
  if (users.value.length === 0) {
    users.value.push({ id: uid(), name: 'Admin', username: 'admin', password: '1234', role: 'admin' })
    saveData(STORAGE_KEYS.USERS, users.value)
  }

  function login(username, password) {
    const user = users.value.find(u => u.username === username && u.password === password)
    if (!user) return { ok: false, error: 'Invalid username or password.' }
    currentUser.value = user
    saveData(STORAGE_KEYS.SESSION, user)
    return { ok: true }
  }

  function register({ name, username, password }) {
    if (!name || !username || !password) return { ok: false, error: 'All fields are required.' }
    if (password.length < 4) return { ok: false, error: 'Password must be at least 4 characters.' }
    if (users.value.find(u => u.username === username)) return { ok: false, error: 'Username already taken.' }
    const newUser = { id: uid(), name, username, password, role: 'staff' }
    users.value.push(newUser)
    saveData(STORAGE_KEYS.USERS, users.value)
    return { ok: true }
  }

  function logout() {
    currentUser.value = null
    removeData(STORAGE_KEYS.SESSION)
  }

  return { users, currentUser, login, register, logout }
})
