<template>
  <div>
    <!-- Sub Navigation + Tab Headers (sticky under main header) -->
    <div class="sticky z-30" :style="{ top: 'var(--app-header-height)' }">
      <nav :class="['flex items-center border-b', COLOR_CLASSES.bgSecondaryOpacity, COLOR_CLASSES.borderPrimary]">
        <button 
          @click="subTab = 'time'" 
          :class="['flex-1 py-2 transition-all font-semibold text-base flex items-center justify-center gap-2', COLOR_CLASSES.tabSeparator, subTab === 'time' ? COLOR_CLASSES.activeTab : COLOR_CLASSES.inactiveTab]"
          :style="`border-right-color: ${TAB_SEPARATOR} !important; ${subTab === 'time' ? `text-shadow: ${ACTIVE_TAB_TEXT_SHADOW};` : ''}`">
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
        <button 
          @click="subTab = 'config'" 
          :class="['flex-1 py-2 transition-all font-semibold text-base', subTab === 'config' ? COLOR_CLASSES.activeTab : COLOR_CLASSES.inactiveTab]"
          :style="subTab === 'config' ? `text-shadow: ${ACTIVE_TAB_TEXT_SHADOW};` : ''">
          {{ t('runs_config') || 'Configuration' }}
        </button>
      </nav>

      <!-- Header for Configuration Tab -->
      <div v-if="subTab === 'config'" :class="['px-4 py-2 border-b flex items-center gap-4 h-[50px]', COLOR_CLASSES.bgSecondaryOpacity, COLOR_CLASSES.borderPrimary]">
        <!-- Toggle all button -->
        <ToggleAllButton
          :isExpanded="allExpanded"
          @toggle="toggleAll"
        />

        <!-- Import button -->
        <button 
          @click="importRuns"
          :class="['px-4 py-2 text-sm rounded font-semibold transition-colors', 'bg-green-900/50 hover:bg-green-800 text-green-200']"
          :title="t('runs_import') || 'Importer depuis le presse-papier'">
          📥 {{ t('runs_import') || 'Importer' }}
        </button>

        <!-- Export button -->
        <button 
          v-if="hasAnyRuns"
          @click="exportRuns"
          :class="['px-4 py-2 text-sm rounded font-semibold transition-colors', 'bg-blue-900/50 hover:bg-blue-800 text-blue-200']"
          :title="t('runs_export') || 'Copier la configuration dans le presse-papier'">
          📋 {{ t('runs_export') || 'Exporter' }}
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

      <!-- Header for Kamas / Time Tab -->
      <div v-if="subTab === 'time'" :class="['px-4 py-2 border-b h-[50px]', COLOR_CLASSES.bgSecondaryOpacity, COLOR_CLASSES.borderPrimary]">
        <ToggleAllButton
          :isExpanded="allHourRunsExpanded"
          @toggle="toggleAllHourRuns"
        />
      </div>
    </div>

    <!-- Kamas / Time Tab -->
    <div v-if="subTab === 'time'" class="px-8 py-6 max-w-[1920px] mx-auto">

      <!-- Runs list -->
      <div v-if="!jsonStore.loaded" class="text-center">
        <p :class="['text-lg', COLOR_CLASSES.textLoading]">{{ t('loading') }}</p>
      </div>
      <div v-else-if="sortedHourRuns.length === 0" :class="[COLOR_CLASSES.bgSecondary, COLOR_CLASSES.borderCard, 'rounded-lg p-6']">
        <p 
          :class="[COLOR_CLASSES.textSecondary, 'cursor-pointer hover:underline']"
          @click="subTab = 'config'"
        >
          {{ t('kamas_hour_no_runs') || 'Aucun run configuré. Allez dans l\'onglet "Configuration" pour en créer.' }}
        </p>
      </div>
      <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <InstanceCard
          v-for="runData in sortedHourRuns"
          :key="runData.key"
          :instance-id="runData.instanceId"
          :run="runData.run"
        />
      </div>
    </div>

    <!-- Configuration Tab -->
    <div v-else class="px-8 py-6 max-w-[1920px] mx-auto">
    <!-- Loading state -->
    <div v-if="!jsonStore.loaded" class="text-center py-8">
      <p :class="['text-lg', COLOR_CLASSES.textLoading]">{{ t('loading') || 'Chargement des données...' }}</p>
    </div>

    <!-- Instances grid -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      <RunConfigCard 
        v-for="inst in sortedInstances" 
        :key="inst.id"
        :instance="inst"
      />
    </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useAppStore } from '@/stores/useAppStore'
import { useJsonStore } from '@/stores/useJsonStore'
import { useRunStore } from '@/stores/useRunStore'
import { useNameStore } from '@/stores/useNameStore'
import { instancePassesFilters } from '@/composables/useInstanceFilters'
import { useLocalStorage } from '@/composables/useLocalStorage'
import { COLOR_CLASSES, TAB_SEPARATOR, ACTIVE_TAB_TEXT_SHADOW } from '@/constants/colors'
import RunConfigCard from '@/components/RunConfig/RunConfigCard.vue'
import InstanceCard from '@/components/InstanceCard.vue'
import ToggleAllButton from '@/components/ToggleAllButton.vue'

const appStore = useAppStore()
const jsonStore = useJsonStore()
const nameStore = useNameStore()
const runStore = useRunStore()

// Sub-tab management
const subTab = useLocalStorage('wakfarm_runs_subTab', 'time')

const t = (key) => nameStore.names?.divers?.[key] || key

// Get all instances sorted by level (enriched with name and bossId for UI)
const sortedInstances = computed(() => {
  const instances = jsonStore._rawInstances || []
  return instances
    .map(inst => ({
      id: inst.id,
      level: inst.level,
      isDungeon: inst.isDungeon || false,
      isUltimate: inst.isUltimate || false,
      bossId: inst.bossId || null,
      name: nameStore.names?.instances?.[inst.id] || `Instance #${inst.id}`
    }))
    .sort((a, b) => a.level - b.level)
})

// Get instances that have runs
const instancesWithRuns = computed(() => {
  return sortedInstances.value.filter(inst => {
    const runs = runStore.getRunsForInstance(inst.id)
    return runs && runs.length > 0
  })
})

// Check if all instances with runs are expanded
const allExpanded = computed(() => {
  if (instancesWithRuns.value.length === 0) return false
  return instancesWithRuns.value.every(inst => runStore.expandedInstances.has(inst.id))
})

// Check if there are any runs
const hasAnyRuns = computed(() => {
  return Object.keys(runStore.runs).length > 0
})

function toggleAll() {
  if (allExpanded.value) {
    runStore.collapseAll()
  } else {
    runStore.expandAll(instancesWithRuns.value.map(i => i.id))
  }
}

function removeAllRuns() {
  if (confirm(t('runs_confirm_remove_all') || 'Êtes-vous sûr de vouloir supprimer tous les runs ?')) {
    runStore.removeAllRuns()
  }
}

async function exportRuns() {
  const result = await runStore.exportRuns()
  alert(result.message)
}

async function importRuns() {
  try {
    const result = await runStore.importRuns()
    alert(`Import réussi ! ${result.count} instance(s) importée(s).`)
  } catch (error) {
    alert(error.message)
  }
}

// Kamas/Time logic
// Persist expanded hour runs as an array in localStorage; cards manage their own expansion.
const expandedHourRuns = useLocalStorage('wakfarm_expanded_hour_runs', [])

const timePeriod = useLocalStorage('wakfarm_time_period', 60)

// Validate time period input
function validateTimePeriod(event) {
  const value = event.target.value
  timePeriod.value = value === '' ? null : Math.max(1, Math.min(999, parseInt(value) || 60))
}

// Build all runs with their kamas/period calculation
const sortedHourRuns = computed(() => {
  if (!jsonStore.loaded) return []
  
  const allRuns = []
  const period = timePeriod.value || 60
  
  // Iterate through all configured runs
  Object.entries(runStore.runs).forEach(([instanceId, runs]) => {
    runs.forEach(run => {
      const instanceIdNum = parseInt(instanceId)
      const instanceData = jsonStore.calculateInstanceForRun(instanceIdNum, run)
      
          if (instanceData && run.time > 0) {
            // Use shared filter logic
            if (!instancePassesFilters(instanceData, appStore)) return
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
  return sortedHourRuns.value.every(r => expandedHourRuns.value.includes(r.key))
})

function toggleAllHourRuns() {
  if (allHourRunsExpanded.value) {
    expandedHourRuns.value = []
  } else {
    expandedHourRuns.value = sortedHourRuns.value.map(r => r.key)
  }
}
</script>