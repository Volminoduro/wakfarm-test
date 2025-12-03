<script setup>
import { computed } from 'vue'
import { formatNumber } from '../utils/formatters'
import { formatRunConfig } from '../utils/runHelpers'
import { getSteleInfo, getRarityColor } from '../utils/itemHelpers'
import { COLOR_CLASSES } from '../constants/colors'
import { useDataStore } from '../stores/useDataStore'
import ExpandArrow from './ExpandArrow.vue'

const props = defineProps({
  instanceId: {
    type: Number,
    required: true
  },
  run: {
    type: Object,
    required: true
  },
  timePeriod: {
    type: Number,
    default: 60
  },
  isExpanded: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['toggle'])

const dataStore = useDataStore()

// Calculate instance data for this specific run config
const instanceData = computed(() => {
  return dataStore.calculateInstanceForRun(props.instanceId, props.run)
})

// Calculate iterations per time period
const iterationsPerPeriod = computed(() => {
  if (!props.run.time || props.run.time === 0) return 0
  const period = props.timePeriod || 60
  return Math.floor(period / props.run.time)
})

// Calculate total kamas per time period
const kamasPerPeriod = computed(() => {
  if (!instanceData.value || iterationsPerPeriod.value === 0) return 0
  return Math.floor(instanceData.value.totalKamas * iterationsPerPeriod.value)
})

const formattedKamasPerPeriod = computed(() => {
  return formatNumber(kamasPerPeriod.value)
})

// Format the run title
const runTitle = computed(() => {
  const instanceName = dataStore.names?.instances?.[props.instanceId] || `Instance #${props.instanceId}`
  const level = instanceData.value?.level || '?'
  const configStr = formatRunConfig(props.run)
  const timeStr = props.run.time ? `${props.run.time}min` : '?'
  
  return `${instanceName} (niv. ${level}) • ${configStr} • ${timeStr}`
})
</script>

<template>
  <div :class="COLOR_CLASSES.card">
    <!-- Header clickable: toggles expand/collapse -->
    <div @click="emit('toggle')" class="px-5 py-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-800/30 transition-colors">
      <div class="flex items-center gap-3 flex-1 truncate">
        <div :class="['font-bold text-sm truncate', COLOR_CLASSES.textLight]">
          {{ runTitle }}
        </div>
      </div>

      <div class="flex items-center gap-4">
        <div class="text-right">
          <div :class="['text-xs', COLOR_CLASSES.textMuted]">
            {{ iterationsPerPeriod }}x
          </div>
          <div :class="['font-bold text-lg', COLOR_CLASSES.textKamas]">
            {{ formattedKamasPerPeriod }} ₭
          </div>
        </div>
        <ExpandArrow :isExpanded="isExpanded" />
      </div>
    </div>

    <transition name="slide">
      <ul v-if="isExpanded && instanceData && instanceData.items && instanceData.items.length > 0" 
          :class="['divide-y divide-white/20', COLOR_CLASSES.bgSecondary]">
        <li v-for="item in instanceData.items" :key="item.itemId" class="px-5 py-2 flex justify-between items-center">
          <div class="flex items-center gap-3">
            <div :class="COLOR_CLASSES.textNormal">
              <span :class="'font-bold'" :style="{ color: getRarityColor(item.rarity) }">
                {{ dataStore.names?.items?.[item.itemId] || ('#' + item.itemId) }}
              </span>
              <span> x{{ item.quantity }} ({{ (item.rate * 100).toFixed(1) }}%{{ getSteleInfo(item) }})</span>
            </div>
          </div>
          <div class="text-right">
            <div :class="['font-semibold', COLOR_CLASSES.textKamas]">
              {{ formatNumber(Math.floor(item.subtotal * iterationsPerPeriod)) }} ₭
            </div>
            <div :class="['text-xs', COLOR_CLASSES.textMuted]">
              {{ formatNumber(item.subtotal) }} ₭/run
            </div>
          </div>
        </li>
      </ul>
    </transition>
  </div>
</template>
