import { createApp } from 'vue'
import './style.css'
import { useAppStore } from '@/stores/useAppStore'
import { createPinia } from 'pinia'
import App from './App.vue'
import { useNameStore } from '@/stores/useNameStore'
import { useJsonStore } from '@/stores/useJsonStore'
import { useRunStore } from '@/stores/useRunStore'

const pinia = createPinia()

const app = createApp(App)
app.use(pinia)
app.mount('#app')

// Initialize stores (pass pinia instance to avoid active-Pinia timing issues)
const appStore = useAppStore(pinia)
const jsonStore = useJsonStore(pinia)
const nameStore = useNameStore(pinia)
const runStore = useRunStore(pinia)