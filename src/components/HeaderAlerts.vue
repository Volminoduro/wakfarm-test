<template>
  <div v-if="alertLevel" class="relative group">
    <svg 
      class="w-8 h-8 cursor-help transition-transform group-hover:scale-110" 
      :class="alertLevel === 'danger' ? 'text-red-500' : 'text-orange-500'"
      fill="currentColor" 
      viewBox="0 0 20 20">
      <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
    </svg>

    <div class="absolute left-0 top-full mt-2 hidden group-hover:block z-50 w-96">
      <div class="bg-gray-900 text-white rounded-lg shadow-2xl p-4 border-2" 
           :class="alertLevel === 'danger' ? 'border-red-500' : 'border-orange-500'">
        <ul class="space-y-2">
          <li v-for="(warning, index) in warnings" :key="index" class="flex items-start gap-2">
            <span class="text-lg flex-shrink-0" :class="warning.type === 'danger' ? 'text-red-500' : 'text-orange-500'">
              {{ warning.type === 'danger' ? '●' : '▲' }}
            </span>
            <span class="text-sm">{{ warning.message }}</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useNameStore } from '@/stores/useNameStore'

const nameStore = useNameStore()

const warnings = computed(() => {
  const list = []
  // Provide a single place to add alerts/warnings.
  // Example placeholders (commented):
  // list.push({ type: 'warning', message: nameStore.names?.divers?.some_warning_key || 'Avertissement exemple' })
  // list.push({ type: 'danger', message: nameStore.names?.divers?.some_danger_key || 'Danger exemple' })
  return list
})

const alertLevel = computed(() => {
  if (warnings.value.length === 0) return null
  return warnings.value.some(w => w.type === 'danger') ? 'danger' : 'warning'
})
</script>

<style scoped>
/* Keep styles minimal; the parent header will handle placement */
</style>
