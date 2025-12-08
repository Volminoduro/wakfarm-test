<template>
  <div>
    
    <!-- Toggle All Button and Config Row (sticky under app header using Tailwind sticky) -->
    <div class="sticky z-30" :style="{ top: 'var(--app-header-height)' }">
      <div :class="['px-4 py-2 border-b', COLOR_CLASSES.bgSecondaryOpacity, COLOR_CLASSES.borderPrimary]">
        <div class="flex items-center justify-between gap-4">
          <ToggleAllButton
            :isExpanded="allRunExpanded"
            @toggle="toggleAllRun"
          />

          <!-- Config row: Modulé, Booster, Stasis, Stèles, Stèles Interv. -->
          <div class="flex items-center gap-6">
            <div class="flex flex-col items-center gap-1">
              <label :class="['text-xs font-medium', COLOR_CLASSES.textSecondary]">{{ t('config_modulated') }}</label>
              <input 
                type="checkbox" 
                v-model="appStore.config.isModulated"
                class="custom-checkbox"
              />
            </div>

            <div class="flex flex-col items-center gap-1">
              <label :class="['text-xs font-medium', COLOR_CLASSES.textSecondary]">{{ t('config_booster') }}</label>
              <input 
                type="checkbox" 
                v-model="appStore.config.isBooster"
                class="custom-checkbox"
              />
            </div>

            <div class="flex flex-col items-center gap-1">
              <label :class="['text-xs font-medium', COLOR_CLASSES.textSecondary]">{{ t('config_stasis') }}</label>
              <select 
                v-model.number="appStore.config.stasis"
                :class="[COLOR_CLASSES.select, 'w-[65px]']"
              >
                <option v-for="n in 10" :key="n" :value="n">{{ n }}</option>
              </select>
            </div>

            <div class="flex flex-col items-center gap-1">
              <label :class="['text-xs font-medium', COLOR_CLASSES.textSecondary]">{{ t('config_steles') }}</label>
              <select 
                v-model.number="appStore.config.steles"
                :class="[COLOR_CLASSES.select, 'w-[65px]']"
              >
                <option v-for="n in 5" :key="n" :value="n - 1">{{ n - 1 }}</option>
              </select>
            </div>

            <div class="flex flex-col items-center gap-1">
              <label :class="['text-xs font-medium', COLOR_CLASSES.textSecondary]">{{ t('config_stele_intervention') }}</label>
              <select 
                v-model.number="appStore.config.steleIntervention"
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
    </div>
    
    <!-- Kamas / Run -->
    <div class="px-8 py-6 max-w-[1920px] mx-auto">
      <div v-if="!jsonStore.loaded" class="text-center">
        <p :class="['text-lg', COLOR_CLASSES.textLoading]">Chargement des données...</p>
      </div>
      <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <InstanceCard
          v-for="inst in sortedInstances"
          :key="inst.key"
          :instance="inst"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAppStore } from '@/stores/useAppStore'
import { useJsonStore } from '@/stores/useJsonStore'
import { useNameStore } from '@/stores/useNameStore'
import InstanceCard from '@/components/Instance/InstanceCard.vue'
import ToggleAllButton from '@/components/ToggleAllButton.vue'
import { COLOR_CLASSES } from '@/constants/colors'
import { useLocalStorage } from '@/composables/useLocalStorage'
import { calculateInstanceForRunAndPassFilters } from '@/utils/instanceProcessor'


const appStore = useAppStore()
const jsonStore = useJsonStore()
const nameStore = useNameStore()

const t = (key) => {
  return nameStore.names?.divers?.[key] || key
}

// Gestion de l'expansion pour Kamas/Run (persistée en localStorage)
const expandedRun = useLocalStorage('wakfarm_expanded_run', [])

// Expanded run keys are persisted in `expandedRun` (localStorage)

// Calculer et trier les instances dynamiquement (sur demande via instancesBase)
const sortedInstances = computed(() => {
  if (!jsonStore.loaded) return []

  const enriched = jsonStore.instancesBase.map(inst => {
    const result = calculateInstanceForRunAndPassFilters(inst.id, appStore.config)
    return result
  }).filter(inst => inst && inst.isDungeon)

  return (enriched || [])
    .map(inst => ({
      ...inst,
      key: `global_${inst.id}`
    }))
    .sort((a, b) => (b.totalKamas || 0) - (a.totalKamas || 0))
})

const allRunExpanded = computed(() => {
  if (sortedInstances.value.length === 0) return false
  return sortedInstances.value.every(inst => expandedRun.value.includes(inst.key))
})

function toggleAllRun() {
  if (allRunExpanded.value) {
    expandedRun.value = []
  } else {
    expandedRun.value = sortedInstances.value.map(inst => inst.key)
  }
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