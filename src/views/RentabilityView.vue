<template>
  <div>
    <!-- Sub Navigation -->
    <nav class="flex items-center bg-slate-800/50 border-b border-slate-700">
      <button 
        @click="emit('change-sub-tab', 'run')" 
        :class="['flex-1 py-2 transition-all font-semibold text-base', subTab === 'run' ? 'border-b-2 border-amber-300 text-amber-300' : 'text-slate-400 hover:text-amber-200']">
        Kamas / Run
      </button>
      <button 
        @click="emit('change-sub-tab', 'time')" 
        :class="['flex-1 py-2 transition-all font-semibold text-base', subTab === 'time' ? 'border-b-2 border-amber-300 text-amber-300' : 'text-slate-400 hover:text-amber-200']">
        Kamas / Heure
      </button>
    </nav>
    
    <!-- Toggle All Button -->
    <div v-if="subTab === 'run'" class="px-1 py-1 bg-slate-800/30 border-b border-slate-700">
      <button 
        @click="emit('toggle-all')" 
        class="px-1 py-1 text-sm transition-all text-slate-400 hover:text-amber-200 hover:bg-slate-700 rounded" 
        :title="allExpanded ? t('toggle_collapse_all') : t('toggle_expand_all')">
        <span class="flex items-center gap-2">
          <svg v-if="!allExpanded" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          {{ allExpanded ? t('toggle_collapse_all') : t('toggle_expand_all') }}
        </span>
      </button>
    </div>
    
    <!-- Kamas / Run -->
    <div v-if="subTab === 'run'" class="px-8 py-6 max-w-[1920px] mx-auto">
      <div v-if="!dataStore.loaded" class="text-center">
        <p class="text-amber-400 text-lg">Chargement des données...</p>
      </div>
      <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <InstanceCard 
          v-for="inst in sortedInstances" 
          :key="inst.id"
          :instance="inst"
          :isExpanded="expanded.has(inst.id)"
          :names="dataStore.names"
          @toggle="toggleExpand(inst.id)"
        />
      </div>
    </div>

    <!-- Kamas / Heure -->
    <div v-else class="px-8 py-4 max-w-[1920px] mx-auto">
      <p class="mb-4 text-slate-300">Vos configurations personnalisées (Sauvegardées localement)</p>
      <div class="bg-slate-800 border border-amber-500/30 rounded-lg p-4">
        <p class="text-slate-300">Work in progress: Configuration horaire</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue'
import { useDataStore } from '../stores/useDataStore'
import InstanceCard from '../components/InstanceCard.vue'

defineProps({
  subTab: {
    type: String,
    required: true
  },
  expanded: {
    type: Set,
    required: true
  },
  allExpanded: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['toggleExpand', 'change-sub-tab', 'toggle-all'])

const dataStore = useDataStore()

const t = (key) => {
  return dataStore.names?.divers?.[key] || key
}

// Calculer et trier les instances dynamiquement
const sortedInstances = computed(() => {
  if (!dataStore.loaded) return []
  return dataStore.instancesRefined
    .map(inst => ({ ...inst }))
    .sort((a, b) => (b.totalKamas || 0) - (a.totalKamas || 0))
})

function toggleExpand(id) {
  emit('toggleExpand', id)
}
</script>

<style scoped>
</style>