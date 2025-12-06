<script setup>
import { computed, ref } from 'vue'
import { useLocalStorage } from '../composables/useLocalStorage'
import { formatNumber, formatQuantity, formatRate } from '../utils/formatters'
import { formatRunConfig } from '../utils/runHelpers'
import { getSteleInfo, getRarityColor } from '../utils/itemHelpers'
import { COLOR_CLASSES } from '../constants/colors'
import InstanceBaseCard from './InstanceBaseCard.vue'
import { useNameStore } from '../stores/useNameStore'

const props = defineProps({
  instance: {
    type: Object,
    required: true
  }
})

// Manage expanded state locally using the shared localStorage array `wakfarm_expanded_run`.
const expandedRun = useLocalStorage('wakfarm_expanded_run', [])

const storageKey = computed(() => {
  // prefer an explicit uniqueKey if provided, otherwise derive from id
  return props.instance.uniqueKey || `global_${props.instance.id}`
})

const isExpanded = computed(() => expandedRun.value.includes(storageKey.value))

function toggleExpand() {
  const key = storageKey.value
  const idx = expandedRun.value.indexOf(key)
  if (idx > -1) {
    const copy = [...expandedRun.value]
    copy.splice(idx, 1)
    expandedRun.value = copy
  } else {
    expandedRun.value = [...expandedRun.value, key]
  }
}

const INITIAL_ITEMS_SHOWN = 15
const showAllItems = ref(false)
const nameStore = useNameStore()

const instanceTitle = computed(() => {
  const baseName = nameStore.names.instances[props.instance.id] || ('Instance ' + props.instance.id)
  const level = props.instance.level
  const levelText = nameStore.names.divers['niveau_reduit'] || 'Niv.'
  
  if (props.instance.isManualRun && props.instance.runConfig) {
    const configStr = formatRunConfig(props.instance.runConfig)
    const timeStr = props.instance.runConfig.time ? `${props.instance.runConfig.time}min` : '?'
    return `${baseName} (${levelText} ${level}) • ${configStr} • ${timeStr}`
  }
  
  return `${baseName} (${levelText} ${level})`
})

const displayedItems = computed(() => {
  if (!props.instance.items) return []
  if (showAllItems.value || props.instance.items.length <= INITIAL_ITEMS_SHOWN) {
    return props.instance.items
  }
  return props.instance.items.slice(0, INITIAL_ITEMS_SHOWN)
})

const hasMoreItems = computed(() => {
  return props.instance.items && props.instance.items.length > INITIAL_ITEMS_SHOWN
})

const toggleShowAll = () => {
  showAllItems.value = !showAllItems.value
}
</script>

<template>
  <InstanceBaseCard
    :boss-id="instance.bossId"
    :title="instanceTitle"
    :total-kamas="instance.totalKamas"
    :is-expanded="isExpanded"
    :clickable="true"
    @toggle="toggleExpand"
  >
    <transition name="expand">
      <div v-if="isExpanded && instance.items && instance.items.length > 0" class="overflow-hidden" style="contain: layout style paint;">
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
            {{ showAllItems ? `Voir moins (${INITIAL_ITEMS_SHOWN} items)` : `Voir tout (${instance.items.length} items)` }}
          </button>
        </div>
      </div>
    </transition>
  </InstanceBaseCard>
</template>

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
