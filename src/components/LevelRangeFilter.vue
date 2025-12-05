<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useGlobalStore } from '../stores/useGlobalStore'
import { LEVEL_RANGES } from '../constants'
import { COLOR_CLASSES } from '../constants/colors'

const store = useGlobalStore()
const jsonStore = store.jsonStore
const isOpen = ref(false)
const dropdownRef = ref(null)

const t = (key) => jsonStore.names?.divers?.[key] || key

// Fermer le dropdown quand on clique en dehors
const handleClickOutside = (event) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

const toggleRange = (index) => {
  const ranges = [...store.config.levelRanges]
  const idx = ranges.indexOf(index)
  
  if (idx > -1) {
    ranges.splice(idx, 1)
  } else {
    ranges.push(index)
    ranges.sort((a, b) => a - b)
  }
  
  store.config.levelRanges = ranges
}

const isRangeActive = (index) => {
  return store.config.levelRanges.includes(index)
}

const toggleAll = () => {
  if (store.config.levelRanges.length === LEVEL_RANGES.length) {
    // Tout décocher
    store.config.levelRanges = []
  } else {
    // Tout cocher
    store.config.levelRanges = LEVEL_RANGES.map((_, i) => i)
  }
  // Fermer le menu après l'action
  isOpen.value = false
}

const getDisplayText = () => {
  const count = store.config.levelRanges.length
  if (count === 0) return t('level_ranges_none')
  if (count === LEVEL_RANGES.length) return t('level_ranges_all')
  // Format fixe pour éviter le changement de largeur
  return `${count.toString().padStart(2, ' ')}/${LEVEL_RANGES.length}`
}
</script>

<template>
  <div class="relative" ref="dropdownRef">
    <button
      @click="isOpen = !isOpen"
      :class="[COLOR_CLASSES.select, 'w-full text-left flex items-center justify-between']"
      type="button"
      style="min-width: 160px;">
      <span class="font-mono">{{ getDisplayText() }}</span>
      <svg 
        :class="['w-4 h-4 transition-transform', isOpen ? 'rotate-180' : '']"
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>
    
    <div 
      v-if="isOpen"
      :class="['absolute z-50 mt-1 w-full rounded shadow-lg', COLOR_CLASSES.bgSecondary, COLOR_CLASSES.borderCard]"
      style="max-height: 300px; overflow-y: auto;">
      <div class="p-2">
        <button 
          @click="toggleAll"
          :class="['w-full text-sm px-2 py-1 rounded mb-2', COLOR_CLASSES.buttonToggle]">
          {{ store.config.levelRanges.length === LEVEL_RANGES.length ? t('level_ranges_toggle_none') : t('level_ranges_toggle_all') }}
        </button>
        <div class="space-y-1">
          <label
            v-for="(range, index) in LEVEL_RANGES"
            :key="index"
            class="flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-700/50 cursor-pointer">
            <input
              type="checkbox"
              :checked="isRangeActive(index)"
              @change="toggleRange(index)"
              class="custom-checkbox-small"
            />
            <span :class="COLOR_CLASSES.textNormal">{{ range.label }}</span>
          </label>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-checkbox-small {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  width: 18px;
  height: 18px;
  border: 2px solid rgba(211, 253, 56, 0.4);
  border-radius: 3px;
  background-color: #334155;
  cursor: pointer;
  transition: all 0.15s ease;
}

.custom-checkbox-small:hover {
  border-color: rgba(211, 253, 56, 0.6);
}

.custom-checkbox-small:checked {
  background-color: #d3fd38;
  border-color: #d3fd38;
}
</style>
