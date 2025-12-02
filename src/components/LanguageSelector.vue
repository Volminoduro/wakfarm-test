<template>
  <div class="flex gap-2.5">
    <button
      v-for="lang in languages"
      :key="lang.code"
      @click="handleChange(lang.code)"
:class="[
        'px-3 py-1 rounded transition-all',
        currentLanguage === lang.code 
          ? 'bg-amber-500 shadow-lg ring-2 ring-amber-400' 
          : 'bg-slate-700 hover:bg-slate-600 opacity-70 hover:opacity-100'
      ]"
      :title="lang.name"
    >
      {{ lang.flag }}
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useDataStore } from '../stores/useDataStore'

const dataStore = useDataStore()

// Determine initial language from localStorage or default to 'fr'
const getInitialLanguage = () => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('wakfarm_language')
    if (saved) return saved
  }
  return 'fr'
}

const currentLanguage = ref(getInitialLanguage())

const languages = [
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' }
]

const handleChange = async (langCode) => {
  currentLanguage.value = langCode
  localStorage.setItem('wakfarm_language', langCode)
  await dataStore.loadNames(langCode)
}

onMounted(async () => {
  // Load names for the current language on mount
  await dataStore.loadNames(currentLanguage.value)
})
</script>