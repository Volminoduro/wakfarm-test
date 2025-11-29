import { createApp } from 'vue'
import './style.css'
import { useDataStore } from '@/stores/useDataStore'
import { useGlobalStore } from '@/stores/useGlobalStore'
import { createPinia } from 'pinia'
import App from './App.vue'

const pinia = createPinia()

const app = createApp(App)
app.use(pinia)
app.mount('#app')

// Initialize stores
const dataStore = useDataStore()
const globalStore = useGlobalStore()