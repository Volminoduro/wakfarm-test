<template>
  <InstanceBaseCard
    :boss-id="displayInstance?.bossId"
    :title="instanceTitle"
    :total-kamas="displayInstance?.totalKamas"
    :is-expanded="isExpanded"
    :clickable="true"
    @toggle="toggleExpand"
  >
    <transition name="expand">
      <div v-if="isExpanded && displayInstance?.items && displayInstance.items.length > 0" class="overflow-hidden" style="contain: layout style paint;">
        <ul :class="['divide-y divide-white/20', COLOR_CLASSES.bgSecondary]">
          <li v-for="item in displayedItems" :key="item.itemId" class="px-5 py-2 flex justify-between items-center">
            <div class="flex items-center gap-3">
              <div :class="COLOR_CLASSES.textNormal">
                <span :class="'font-bold'" :style="{ color: getRarityColor(item.rarity) }">{{ nameStore.names.items[item.itemId] || ('#' + item.itemId) }}</span>
                <span> x{{ formatQuantity(item.quantity) }} ({{ formatRate(item.rate) }}%{{ getSteleInfo(item) }})</span>
              </div>
            </div>
            <div :class="['font-semibold', COLOR_CLASSES.textKamas]">{{ formatNumber(item.subtotal) }} ₭</div>
          </li>
        </ul>
        <div v-if="hasMoreItems" :class="['px-5 py-3 text-center', COLOR_CLASSES.bgSecondary]">
          <button 
            @click.stop="toggleShowAll"
            :class="['text-sm font-medium transition-colors hover:underline', COLOR_CLASSES.textLight]">
            {{ showAllItems ? `Voir moins (${INITIAL_ITEMS_SHOWN} items)` : `Voir tout (${displayInstance.items.length} items)` }}
          </button>
        </div>
      </div>
    </transition>
  </InstanceBaseCard>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useLocalStorage } from '@/composables/useLocalStorage'
import { useJsonStore } from '@/stores/useJsonStore'
import { useAppStore } from '@/stores/useAppStore'
import { formatNumber, formatQuantity, formatRate } from '@/utils/formatters'
import { formatRunConfig } from '@/utils/runHelpers'
import { getSteleInfo, getRarityColor } from '@/utils/itemHelpers'
import { COLOR_CLASSES } from '@/constants/colors'
import InstanceBaseCard from './InstanceBaseCard.vue'
import { useNameStore } from '@/stores/useNameStore'
import { getInstanceName } from '../../utils/getInstanceName'
import { calculateInstanceForRun } from '@/utils/instanceProcessor'


const props = defineProps({
  // Either pass a precomputed `instance` object (enriched), or pass `instanceId` + `run` to compute per-run data.
  instance: {
    type: Object,
    required: false
  },
  instanceId: {
    type: Number,
    required: false
  },
  run: {
    type: Object,
    required: false
  },
  // timePeriod is retrieved from AppStore or local storage inside the component
})

const jsonStore = useJsonStore()

// Manage expanded state locally using different localStorage keys depending on mode.
const expandedRun = useLocalStorage('wakfarm_expanded_run', [])
const expandedHourRuns = useLocalStorage('wakfarm_expanded_hour_runs', [])

const isRunMode = computed(() => !!props.run && typeof props.instanceId === 'number')

const storageKey = computed(() => {
  if (isRunMode.value) {
    return `${props.instanceId}_${props.run.id}`
  }
  // prefer an explicit uniqueKey if provided, otherwise derive from id
  return props.instance?.uniqueKey || `global_${props.instance?.id}`
})

const isExpanded = computed(() => {
  const list = isRunMode.value ? expandedHourRuns.value : expandedRun.value
  return list.includes(storageKey.value)
})

function toggleExpand() {
  const key = storageKey.value
  const listRef = isRunMode.value ? expandedHourRuns : expandedRun
  const idx = listRef.value.indexOf(key)
  if (idx > -1) {
    const copy = [...listRef.value]
    copy.splice(idx, 1)
    listRef.value = copy
  } else {
    listRef.value = [...listRef.value, key]
  }
}

const INITIAL_ITEMS_SHOWN = 15
const showAllItems = ref(false)
const nameStore = useNameStore()

const appStore = useAppStore()
const localTimePeriod = useLocalStorage('wakfarm_time_period', 60)

const iterationsPerPeriod = computed(() => {
  if (!isRunMode.value) return 0
  if (!props.run?.time || props.run.time === 0) return 0
  // Prefer central value from appStore.config.timePeriod if present, otherwise fallback to local storage
  const period = (appStore.config && appStore.config.timePeriod) || localTimePeriod.value || 60
  return Math.floor(period / props.run.time)
})

// Build a normalized `displayInstance` object used by the template regardless of mode
const displayInstance = computed(() => {
  if (!isRunMode.value) {
    return props.instance || null
  }
  // run mode: compute instance data for this run
  const data = calculateInstanceForRun(props.instanceId, props.run)
  if (!data) return null

  const iters = iterationsPerPeriod.value || 0
  // clone and scale items
  const scaledItems = (data.items || []).map(it => ({
    ...it,
    quantity: (it.quantity || 0) * iters,
    subtotal: Math.floor((it.subtotal || 0) * iters)
  }))

  return {
    id: data.id,
    level: data.level,
    bossId: data.bossId || null,
    items: scaledItems,
    totalKamas: Math.floor((data.totalKamas || 0) * iters),
    // keep run metadata for title formatting
    isManualRun: true,
    runConfig: props.run
  }
})

const displayedItems = computed(() => {
  if (!displayInstance.value?.items) return []
  if (showAllItems.value || displayInstance.value.items.length <= INITIAL_ITEMS_SHOWN) {
    return displayInstance.value.items
  }
  return displayInstance.value.items.slice(0, INITIAL_ITEMS_SHOWN)
})

const hasMoreItems = computed(() => {
  return displayInstance.value?.items && displayInstance.value.items.length > INITIAL_ITEMS_SHOWN
})

const toggleShowAll = () => {
  showAllItems.value = !showAllItems.value
}

const instanceTitle = computed(() => {
  const inst = displayInstance.value
  if (!inst) return ''
  const baseName = getInstanceName(inst.id) || ('Instance ' + inst.id)
  const level = inst.level
  const levelText = nameStore.names.divers?.['niveau_reduit'] || 'Niv.'

  // If there is a runConfig (manual or run-mode), include config/time and iterations
  if (inst.runConfig) {
    const configStr = formatRunConfig(inst.runConfig)
    const timeStr = inst.runConfig.time ? `${inst.runConfig.time}min` : '?'
    const iters = iterationsPerPeriod.value || 0
    return `${baseName} (${levelText} ${level}) • ${configStr} • ${timeStr} • ${iters}×`
  }

  return `${baseName} (${levelText} ${level})`
})
</script>

<style scoped>
/* Smooth expand/collapse transition with GPU acceleration */
.expand-enter-active,
.expand-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
  transform-origin: top;
  will-change: opacity, transform;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  transform: scaleY(0.95);
}

.expand-enter-to,
.expand-leave-from {
  opacity: 1;
  transform: scaleY(1);
}

.expand-enter-active > *,
.expand-leave-active > * {
  will-change: transform;
}
</style>
