<template>
  <div>
    
    <!-- Toggle All Button and Config Row -->
    <div :class="['px-4 py-2 border-b', COLOR_CLASSES.bgSecondaryOpacity, COLOR_CLASSES.borderPrimary]">
      <div class="flex items-center justify-between gap-4">
        <ToggleAllButton
          :isExpanded="allRunExpanded"
          :expandText="t('toggle_expand_all')"
          :collapseText="t('toggle_collapse_all')"
          @toggle="toggleAllRun"
        />
        
        <!-- Config row: Modulé, Booster, Stasis, Stèles, Stèles Interv. -->
        <div class="flex items-center gap-6">
          <div class="flex flex-col items-center gap-1">
            <label :class="['text-xs font-medium', COLOR_CLASSES.textSecondary]">{{ t('config_modulated') }}</label>
            <input 
              type="checkbox" 
              v-model="globalStore.config.isModulated"
              class="custom-checkbox"
            />
          </div>
          
          <div class="flex flex-col items-center gap-1">
            <label :class="['text-xs font-medium', COLOR_CLASSES.textSecondary]">{{ t('config_booster') }}</label>
            <input 
              type="checkbox" 
              v-model="globalStore.config.isBooster"
              class="custom-checkbox"
            />
          </div>
          
          <div class="flex flex-col items-center gap-1">
            <label :class="['text-xs font-medium', COLOR_CLASSES.textSecondary]">{{ t('config_stasis') }}</label>
            <select 
              v-model.number="globalStore.config.stasis"
              :class="[COLOR_CLASSES.select, 'w-[65px]']"
            >
              <option v-for="n in 10" :key="n" :value="n">{{ n }}</option>
            </select>
          </div>
          
          <div class="flex flex-col items-center gap-1">
            <label :class="['text-xs font-medium', COLOR_CLASSES.textSecondary]">{{ t('config_steles') }}</label>
            <select 
              v-model.number="globalStore.config.steles"
              :class="[COLOR_CLASSES.select, 'w-[65px]']"
            >
              <option v-for="n in 5" :key="n" :value="n - 1">{{ n - 1 }}</option>
            </select>
          </div>
          
          <div class="flex flex-col items-center gap-1">
            <label :class="['text-xs font-medium', COLOR_CLASSES.textSecondary]">{{ t('config_stele_intervention') }}</label>
            <select 
              v-model.number="globalStore.config.steleIntervention"
              :class="[COLOR_CLASSES.select, 'w-[65px]']"
            >
              <option v-for="n in 4" :key="n" :value="n - 1">{{ n - 1 }}</option>
            </select>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Disclaimer -->
    <div :class="['px-4 py-2 border-b', COLOR_CLASSES.bgSecondaryOpacity, COLOR_CLASSES.borderPrimary]">
      <p :class="['text-sm italic', COLOR_CLASSES.textSecondary]">{{ t('disclaimer_rifts_excluded') }}</p>
    </div>
    
    <!-- Kamas / Run -->
    <div class="px-8 py-6 max-w-[1920px] mx-auto">
      <div v-if="!dataStore.loaded" class="text-center">
        <p :class="['text-lg', COLOR_CLASSES.textLoading]">Chargement des données...</p>
      </div>
      <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <InstanceCard 
          v-for="inst in sortedInstances" 
          :key="inst.uniqueKey"
          :instance="inst"
          :isExpanded="expandedRunSet.has(inst.uniqueKey)"
          :names="dataStore.names"
          @toggle="toggleExpand(inst.uniqueKey)"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useDataStore } from '../stores/useDataStore'
import { useGlobalStore } from '../stores/useGlobalStore'
import InstanceCard from '../components/InstanceCard.vue'
import ToggleAllButton from '../components/ToggleAllButton.vue'
import { COLOR_CLASSES } from '../constants/colors'
import { useLocalStorage } from '../composables/useLocalStorage'

const dataStore = useDataStore()
const globalStore = useGlobalStore()

const t = (key) => {
  return dataStore.names?.divers?.[key] || key
}

// Gestion de l'expansion pour Kamas/Run
const expandedRun = useLocalStorage('wakfarm_expanded_run', [])
const expandedRunSet = ref(new Set(expandedRun.value || []))

// Calculer et trier les instances dynamiquement (seulement config globale)
const sortedInstances = computed(() => {
  if (!dataStore.loaded) return []
  
  // Utiliser seulement les instances avec config globale (de instancesRefined)
  return dataStore.instancesRefined
    .map(inst => ({
      ...inst,
      uniqueKey: `global_${inst.id}`
    }))
    .sort((a, b) => (b.totalKamas || 0) - (a.totalKamas || 0))
})

const allRunExpanded = computed(() => {
  if (sortedInstances.value.length === 0) return false
  return sortedInstances.value.every(inst => expandedRunSet.value.has(inst.uniqueKey))
})

function toggleExpand(uniqueKey) {
  if (expandedRunSet.value.has(uniqueKey)) {
    expandedRunSet.value.delete(uniqueKey)
  } else {
    expandedRunSet.value.add(uniqueKey)
  }
  expandedRunSet.value = new Set(expandedRunSet.value)
  expandedRun.value = [...expandedRunSet.value]
}

function toggleAllRun() {
  expandedRunSet.value = allRunExpanded.value
    ? new Set()
    : new Set(sortedInstances.value.map(inst => inst.uniqueKey))
  expandedRun.value = [...expandedRunSet.value]
}
</script>

<style scoped>
/* Custom checkbox styling */
.custom-checkbox {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  width: 24px;
  height: 24px;
  border: 2px solid rgba(211, 253, 56, 0.4);
  border-radius: 4px;
  background-color: #334155;
  cursor: pointer;
  position: relative;
  transition: all 0.15s ease;
}

.custom-checkbox:hover {
  border-color: rgba(211, 253, 56, 0.6);
}

.custom-checkbox:checked {
  background-color: #d3fd38;
  border-color: #d3fd38;
}

.custom-checkbox:focus {
  outline: 2px solid #d3fd38;
  outline-offset: 2px;
  border-color: #d3fd38;
}
</style>