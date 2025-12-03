<script setup>
import { computed } from 'vue'
import { useDataStore } from '../stores/useDataStore'
import { useRunsStore } from '../stores/useRunsStore'
import { COLOR_CLASSES } from '../constants/colors'
import RunCard from '../components/RunCard.vue'

const dataStore = useDataStore()
const runsStore = useRunsStore()

const t = (key) => dataStore.names?.divers?.[key] || key

// Get all instances sorted by level
const sortedInstances = computed(() => {
  const instances = dataStore._rawInstances || []
  return instances
    .map(inst => ({
      id: inst.id,
      level: inst.level,
      isDungeon: inst.isDungeon || false
    }))
    .sort((a, b) => a.level - b.level)
})

// Check if all instances are expanded
const allExpanded = computed(() => {
  if (sortedInstances.value.length === 0) return false
  return sortedInstances.value.every(inst => runsStore.expandedInstances.has(inst.id))
})

// Check if there are any runs
const hasAnyRuns = computed(() => {
  return Object.keys(runsStore.runs).length > 0
})

function toggleAll() {
  if (allExpanded.value) {
    runsStore.collapseAll()
  } else {
    runsStore.expandAll(sortedInstances.value.map(i => i.id))
  }
}

function removeAllRuns() {
  if (confirm(t('runs_confirm_remove_all') || 'Êtes-vous sûr de vouloir supprimer tous les runs ?')) {
    runsStore.removeAllRuns()
  }
}
</script>

<template>
  <div class="px-8 py-6 max-w-[1920px] mx-auto">
    <!-- Action buttons -->
    <div :class="['px-4 py-3 mb-4 flex items-center gap-4', COLOR_CLASSES.bgSecondary, COLOR_CLASSES.borderCard, 'rounded-lg']">
      <!-- Toggle all button -->
      <button 
        @click="toggleAll"
        :class="['px-4 py-2 text-sm transition-all rounded font-semibold', COLOR_CLASSES.buttonToggle]"
        :title="allExpanded ? (t('toggle_collapse_all') || 'Tout réduire') : (t('toggle_expand_all') || 'Tout développer')">
        <span class="flex items-center gap-2">
          <svg v-if="!allExpanded" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          {{ allExpanded ? (t('toggle_collapse_all') || 'Tout réduire') : (t('toggle_expand_all') || 'Tout développer') }}
        </span>
      </button>

      <!-- Remove all button -->
      <button 
        v-if="hasAnyRuns"
        @click="removeAllRuns"
        :class="['px-4 py-2 text-sm rounded font-semibold transition-colors', 'bg-red-900/50 hover:bg-red-800 text-red-200']"
        :title="t('runs_remove_all') || 'Supprimer tous les runs'">
        ✕ {{ t('runs_remove_all') || 'Supprimer tous les runs' }}
      </button>

      <!-- Info text -->
      <div class="flex-1 text-right">
        <span :class="['text-sm', COLOR_CLASSES.textSecondary]">
          {{ sortedInstances.length }} {{ t('runs_instances') || 'instances disponibles' }}
        </span>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="!dataStore.loaded" class="text-center py-8">
      <p :class="['text-lg', COLOR_CLASSES.textLoading]">{{ t('loading') || 'Chargement des données...' }}</p>
    </div>

    <!-- Instances grid -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      <RunCard 
        v-for="inst in sortedInstances" 
        :key="inst.id"
        :instance="inst"
      />
    </div>
  </div>
</template>
