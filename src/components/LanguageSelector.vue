<template>
  <div class="flex gap-2.5">
    <button
      v-for="lang in languages"
      :key="lang.code"
      @click="handleChange(lang.code)"
      :class="[
        'px-3 py-1 transition-all border-b-2 text-slate-100',
        currentLanguage === lang.code 
          ? '' 
          : 'border-transparent opacity-70 hover:opacity-100'
      ]"
      :style="currentLanguage === lang.code ? `border-color: ${WAKFU_TEXT}` : ''"
      @mouseenter="(e) => currentLanguage !== lang.code && (e.target.style.borderColor = WAKFU_TEXT_ALT)"
      @mouseleave="(e) => currentLanguage !== lang.code && (e.target.style.borderColor = 'transparent')"
      :title="lang.name"
    >
      {{ lang.flag }}
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useDataStore } from '../stores/useDataStore'
import { WAKFU_TEXT_ALT, WAKFU_TEXT } from '../constants/colors'

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