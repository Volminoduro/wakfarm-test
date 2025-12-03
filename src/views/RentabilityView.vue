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
        :class="['flex-1 py-2 transition-all font-semibold text-base flex items-center justify-center gap-2', subTab === 'time' ? COLOR_CLASSES.activeTab : COLOR_CLASSES.inactiveTab]"
        :style="subTab === 'time' ? `text-shadow: ${ACTIVE_TAB_TEXT_SHADOW};` : ''">
        <span>Kamas /</span>
        <input 
          type="number"
          v-model.number="timePeriod"
          @click.stop
          @input="validateTimePeriod"
          :class="[COLOR_CLASSES.input, 'text-sm py-0 px-2 text-center']"
          style="width: 65px; height: 24px;"
          min="1"
          max="999"
          placeholder="60"
        />
        <span>mins</span>
      </button>
    </nav>
    
    <!-- Toggle All Button (both tabs) -->
    <div :class="['px-1 py-1 border-b', COLOR_CLASSES.bgSecondaryOpacity, COLOR_CLASSES.borderPrimary]">
      <ToggleAllButton
        v-if="subTab === 'run'"
        :isExpanded="allRunExpanded"
        :expandText="t('toggle_expand_all')"
        :collapseText="t('toggle_collapse_all')"
        @toggle="toggleAllRun"
      />
      <ToggleAllButton
        v-else
        :isExpanded="allHourRunsExpanded"
        :expandText="t('toggle_expand_all')"
        :collapseText="t('toggle_collapse_all')"
        @toggle="toggleAllHourRuns"
      />
    </div>
    
    <!-- Kamas / Run -->
    <div v-if="subTab === 'run'" class="px-8 py-6 max-w-[1920px] mx-auto">
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

    <!-- Kamas / Heure -->
    <div v-else class="px-8 py-6 max-w-[1920px] mx-auto">
      <!-- Runs list -->
      <div v-if="!dataStore.loaded" class="text-center">
        <p :class="['text-lg', COLOR_CLASSES.textLoading]">{{ t('loading') }}</p>
      </div>
      <div v-else-if="sortedHourRuns.length === 0" :class="[COLOR_CLASSES.bgSecondary, COLOR_CLASSES.borderCard, 'rounded-lg p-6']">
        <p :class="COLOR_CLASSES.textSecondary">{{ t('kamas_hour_no_runs') || 'Aucun run configuré. Allez dans l\'onglet "Runs" pour en créer.' }}</p>
      </div>
      <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <RunHourCard 
          v-for="runData in sortedHourRuns" 
          :key="runData.key"
          :instanceId="runData.instanceId"
          :run="runData.run"
          :timePeriod="timePeriod"
          :isExpanded="expandedHourRuns.has(runData.key)"
          @toggle="toggleHourRun(runData.key)"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useDataStore } from '../stores/useDataStore'
import { useRunsStore } from '../stores/useRunsStore'
import InstanceCard from '../components/InstanceCard.vue'
import RunHourCard from '../components/RunHourCard.vue'
import ToggleAllButton from '../components/ToggleAllButton.vue'
import { COLOR_CLASSES, TAB_SEPARATOR, ACTIVE_TAB_TEXT_SHADOW } from '../constants/colors'
import { useLocalStorage } from '../composables/useLocalStorage'

const props = defineProps({
  subTab: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['change-sub-tab'])

const dataStore = useDataStore()
const runsStore = useRunsStore()

const t = (key) => {
  return dataStore.names?.divers?.[key] || key
}

// Gestion de l'expansion pour Kamas/Run
const expandedRun = useLocalStorage('wakfarm_expanded_run', [])
const expandedRunSet = ref(new Set(expandedRun.value || []))

// Calculer et trier les instances dynamiquement (incluant runs manuels)
const sortedInstances = computed(() => {
  if (!dataStore.loaded) return []
  
  const allInstances = []
  
  // 1. Ajouter toutes les instances avec config globale (de instancesRefined)
  dataStore.instancesRefined.forEach(inst => {
    allInstances.push({
      ...inst,
      isManualRun: false,
      uniqueKey: `global_${inst.id}`
    })
  })
  
  // 2. Ajouter tous les runs configurés manuellement (seulement si items éligibles)
  Object.entries(runsStore.runs).forEach(([instanceId, runs]) => {
    runs.forEach(run => {
      const instanceIdNum = parseInt(instanceId)
      const instanceData = dataStore.calculateInstanceForRun(instanceIdNum, run)
      
      // N'ajouter que si l'instance a des items éligibles après filtrage
      if (instanceData && instanceData.items && instanceData.items.length > 0) {
        allInstances.push({
          ...instanceData,
          isManualRun: true,
          runConfig: run,
          uniqueKey: `manual_${instanceId}_${run.id}`
        })
      }
    })
  })
  
  // Trier par kamas total décroissant
  return allInstances.sort((a, b) => (b.totalKamas || 0) - (a.totalKamas || 0))
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
  if (allRunExpanded.value) {
    expandedRunSet.value.clear()
  } else {
    expandedRunSet.value = new Set(sortedInstances.value.map(inst => inst.uniqueKey))
  }
  expandedRun.value = [...expandedRunSet.value]
}

// Kamas/Time logic
const expandedHourRuns = ref(new Set())
const timePeriod = useLocalStorage('wakfarm_time_period', 60)

// Validate time period input
function validateTimePeriod(event) {
  const value = event.target.value
  timePeriod.value = value === '' ? null : Math.min(999, Math.max(1, parseInt(value) || 60))
}

// Build all runs with their kamas/period calculation
const sortedHourRuns = computed(() => {
  if (!dataStore.loaded) return []
  
  const allRuns = []
  const period = timePeriod.value || 60
  
  // Iterate through all configured runs
  Object.entries(runsStore.runs).forEach(([instanceId, runs]) => {
    runs.forEach(run => {
      const instanceIdNum = parseInt(instanceId)
      const instanceData = dataStore.calculateInstanceForRun(instanceIdNum, run)
      
      if (instanceData && run.time > 0) {
        const iterations = Math.floor(period / run.time)
        const kamasPerPeriod = Math.floor(instanceData.totalKamas * iterations)
        
        allRuns.push({
          key: `${instanceId}_${run.id}`,
          instanceId: instanceIdNum,
          run,
          kamasPerPeriod,
          iterations
        })
      }
    })
  })
  
  // Sort by kamas/period descending
  return allRuns.sort((a, b) => b.kamasPerPeriod - a.kamasPerPeriod)
})

const allHourRunsExpanded = computed(() => {
  if (sortedHourRuns.value.length === 0) return false
  return sortedHourRuns.value.every(r => expandedHourRuns.value.has(r.key))
})

function toggleHourRun(key) {
  if (expandedHourRuns.value.has(key)) {
    expandedHourRuns.value.delete(key)
  } else {
    expandedHourRuns.value.add(key)
  }
  expandedHourRuns.value = new Set(expandedHourRuns.value)
}

function toggleAllHourRuns() {
  if (allHourRunsExpanded.value) {
    expandedHourRuns.value.clear()
  } else {
    expandedHourRuns.value = new Set(sortedHourRuns.value.map(r => r.key))
  }
}
</script>