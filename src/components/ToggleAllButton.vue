<script setup>
import { COLOR_CLASSES } from '../constants/colors'

defineProps({
  isExpanded: {
    type: Boolean,
    required: true
  },
  expandText: {
    type: String,
    required: true
  },
  collapseText: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['toggle'])
</script>

<template>
  <button 
    @click="emit('toggle')"
    :class="['px-1 py-1 text-sm transition-all rounded', COLOR_CLASSES.buttonToggle]" 
    :title="isExpanded ? collapseText : expandText">
    <span class="flex items-center gap-2">
      <svg v-if="!isExpanded" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      {{ isExpanded ? collapseText : expandText }}
    </span>
  </button>
</template>
