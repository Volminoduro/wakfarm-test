import { createApp } from 'vue'
import './style.css'
import { useGlobalStore } from '@/stores/useGlobalStore'
import { createPinia } from 'pinia'
import App from './App.vue'

const pinia = createPinia()

const app = createApp(App)
app.use(pinia)
app.mount('#app')

// Initialize stores (pass pinia instance to avoid active-Pinia timing issues)
const globalStore = useGlobalStore(pinia)