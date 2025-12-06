<script setup>
import { computed } from 'vue'
import { COLOR_CLASSES } from '../constants/colors'
import { useNameStore } from '../stores/useNameStore'
import RunConfigRow from './RunConfigRow.vue'
import BossIcon from './BossIcon.vue'
import { useRunStore } from '../stores/useRunStore'

const props = defineProps({
  instance: {
    type: Object,
    required: true
  }
})

const runStore = useRunStore()
const nameStore = useNameStore()

const t = (key) => nameStore.names?.divers?.[key] || key

const isExpanded = computed(() => runStore.expandedInstances.has(props.instance.id))
const runs = computed(() => runStore.getRunsForInstance(props.instance.id))
const hasRuns = computed(() => runs.value.length > 0)

function toggleExpand() {
  runStore.toggleExpanded(props.instance.id)
}

function addRun() {
  runStore.addRun(props.instance.id, props.instance)
  // Auto-expand when adding a run
  if (!isExpanded.value) {
    runStore.toggleExpanded(props.instance.id)
  }
}

function removeRun(runId) {
  runStore.removeRun(props.instance.id, runId)
}

function updateRun(updatedRun) {
  runStore.updateRun(props.instance.id, updatedRun.id, updatedRun)
}

function removeAllRuns() {
  runStore.removeAllRunsForInstance(props.instance.id)
}
</script>

<template>
  <div :class="COLOR_CLASSES.card">
    <!-- Header -->
    <div class="px-5 py-4 flex items-center justify-between gap-4">
      <!-- Left: Instance name (clickable to toggle) -->
      <div 
        @click="toggleExpand" 
        class="flex items-center gap-3 cursor-pointer flex-1 truncate"
        :class="{ 'opacity-50': !hasRuns }">
        
        <BossIcon :boss-id="props.instance.bossId" />

        <div :class="['font-bold truncate', COLOR_CLASSES.textLight]">
          {{ props.instance.name }} (niv. {{ props.instance.level }})
        </div>
        
        <svg 
          width="18" 
          height="18" 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          :class="[isExpanded ? 'rotate-down' : '', 'transition-transform', COLOR_CLASSES.textPrimary]">
          <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" fill="currentColor"/>
        </svg>
      </div>

      <!-- Right: Action buttons -->
      <div class="flex items-center gap-2">
        <!-- Remove all button (only show if has runs) -->
        <button 
          v-if="hasRuns"
          @click="removeAllRuns"
          :class="['px-3 py-1 rounded text-sm transition-colors', 'bg-red-900/50 hover:bg-red-800 text-red-200']"
          :title="t('runs_remove_all') || 'Supprimer tous les runs'">
          ✕ {{ t('runs_all') || 'Tous' }}
        </button>

        <!-- Add run button -->
        <button 
          @click="addRun"
          :class="['px-3 py-1 rounded text-sm font-semibold transition-colors', 'bg-green-900/50 hover:bg-green-800 text-green-200']"
          :title="t('runs_add') || 'Ajouter un run'">
          +
        </button>
      </div>
    </div>

    <!-- Runs list (expandable) -->
    <transition name="slide">
      <div v-if="isExpanded && hasRuns">
        <!-- Header row with labels - Rift -->
        <div v-if="!instance.isDungeon" :class="['px-4 py-2 border-t border-[#363634] flex items-center gap-2', COLOR_CLASSES.bgSecondary]">
          <div class="flex items-center gap-2 flex-1">
            <div :class="['text-xs font-semibold', COLOR_CLASSES.textSecondary]" style="width: 60px; text-align: center;">
              {{ t('config_booster') }}
            </div>
            <div :class="['text-xs font-semibold', COLOR_CLASSES.textSecondary]" style="width: 120px; text-align: center;">
              Vague départ
            </div>
            <div :class="['text-xs font-semibold', COLOR_CLASSES.textSecondary]" style="width: 120px; text-align: center;">
              Vagues faites
            </div>
            <!-- Empty spacers to align with dungeon layout (Stasis, Stèles, Stèles Interv.) -->
            <div style="width: 30px;"></div>
            <div :class="['text-xs font-semibold', COLOR_CLASSES.textSecondary]" style="width: 60px; text-align: center;">
              Temps (min)
            </div>
          </div>
          <div style="width: 60px;"></div> <!-- Space for delete button -->
        </div>

        <!-- Header row with labels - Dungeon -->
        <div v-else :class="['px-4 py-2 border-t border-[#363634] flex items-center gap-3', COLOR_CLASSES.bgSecondary]">
          <div class="flex items-center gap-2 flex-1">
            <div :class="['text-xs font-semibold', COLOR_CLASSES.textSecondary]" style="width: 60px; text-align: center;">
              {{ t('config_modulated') }}
            </div>
            <div :class="['text-xs font-semibold', COLOR_CLASSES.textSecondary]" style="width: 60px; text-align: center;">
              {{ t('config_booster') }}
            </div>
            <div :class="['text-xs font-semibold', COLOR_CLASSES.textSecondary]" style="width: 60px; text-align: center;">
              {{ t('config_stasis') }}
            </div>
            <div :class="['text-xs font-semibold', COLOR_CLASSES.textSecondary]" style="width: 60px; text-align: center;">
              {{ t('config_steles') }}
            </div>
            <div :class="['text-xs font-semibold', COLOR_CLASSES.textSecondary]" style="width: 80px; text-align: center;">
              {{ t('config_stele_intervention') }}
            </div>
            <div :class="['text-xs font-semibold', COLOR_CLASSES.textSecondary]" style="width: 60px; text-align: center;">
              {{ t('config_time') }}
            </div>
          </div>
          <div style="width: 60px;"></div> <!-- Space for delete button -->
        </div>

        <!-- Runs rows -->
        <RunConfigRow 
          v-for="run in runs"
          :key="run.id"
          :run="run"
          @update="updateRun"
          @remove="removeRun(run.id)"
        />
      </div>
    </transition>

    <!-- Empty state when expanded but no runs -->
    <div 
      v-if="isExpanded && !hasRuns" 
      :class="['px-5 py-4 text-center border-t border-[#363634]', COLOR_CLASSES.bgSecondary, COLOR_CLASSES.textMuted]">
      {{ t('runs_empty') || 'Aucun run configuré. Cliquez sur "+" pour en ajouter un.' }}
    </div>
  </div>
</template>
