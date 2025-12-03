<template>
  <div>
    <!-- Sub Navigation -->
    <nav :class="['flex items-center border-b', COLOR_CLASSES.bgSecondaryOpacity, COLOR_CLASSES.borderPrimary]">
      <button 
        @click="emit('change-sub-tab', 'run')" 
        :class="['flex-1 py-2 transition-all font-semibold text-base', COLOR_CLASSES.tabSeparator, subTab === 'run' ? COLOR_CLASSES.activeTab : COLOR_CLASSES.inactiveTab]"
        :style="`border-right-color: ${TAB_SEPARATOR} !important; ${subTab === 'run' ? `text-shadow: ${ACTIVE_TAB_TEXT_SHADOW};` : ''}`">
        {{ t('tab_kamas_run') }}
      </button>
      <button 
        @click="emit('change-sub-tab', 'time')" 
        :class="['flex-1 py-2 transition-all font-semibold text-base', subTab === 'time' ? COLOR_CLASSES.activeTab : COLOR_CLASSES.inactiveTab]"
        :style="subTab === 'time' ? `text-shadow: ${ACTIVE_TAB_TEXT_SHADOW};` : ''">
        {{ t('tab_kamas_hour') }}
      </button>
    </nav>
    
    <!-- Toggle All Button -->
    <div v-if="subTab === 'run'" :class="['px-1 py-1 border-b', COLOR_CLASSES.bgSecondaryOpacity, COLOR_CLASSES.borderPrimary]">
      <button 
        @click="emit('toggle-all')" 
        :class="['px-1 py-1 text-sm transition-all rounded', COLOR_CLASSES.buttonToggle]" 
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
        <p :class="['text-lg', COLOR_CLASSES.textLoading]">Chargement des données...</p>
      </div>
      <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
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
      <p :class="['mb-4', COLOR_CLASSES.textSecondary]">{{ t('kamas_hour_user_configs') }}</p>
      <div :class="[COLOR_CLASSES.bgSecondary, COLOR_CLASSES.borderCard, 'rounded-lg p-4']">
        <p :class="COLOR_CLASSES.textSecondary">{{ t('kamas_hour_wip') }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useDataStore } from '../stores/useDataStore'
import InstanceCard from '../components/InstanceCard.vue'
import { COLOR_CLASSES, TAB_SEPARATOR, ACTIVE_TAB_TEXT_SHADOW } from '../constants/colors'

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