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
import { computed } from 'vue'
import { useAppStore } from '@/stores/useAppStore'
import { WAKFU_TEXT_ALT, WAKFU_TEXT } from '@/constants/colors'

const appStore = useAppStore()

const currentLanguage = computed(() => appStore.language)

const languages = [
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' }
]

const handleChange = async (langCode) => {
  await appStore.setLanguage(langCode)
}

</script>