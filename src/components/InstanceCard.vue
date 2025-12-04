<script setup>
import { computed } from 'vue'
import { formatNumber } from '../utils/formatters'
import { formatRunConfig } from '../utils/runHelpers'
import { getSteleInfo, getRarityColor } from '../utils/itemHelpers'
import { COLOR_CLASSES } from '../constants/colors'
import ExpandArrow from './ExpandArrow.vue'

const props = defineProps({
  instance: {
    type: Object,
    required: true
  },
  isExpanded: {
    type: Boolean,
    required: true
  },
  names: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['toggle'])

const instanceTitle = computed(() => {
  const baseName = props.names.instances[props.instance.id] || ('Instance ' + props.instance.id)
  const level = props.instance.level
  const levelText = props.names.divers['niveau_reduit'] || 'Niv.'
  
  if (props.instance.isManualRun && props.instance.runConfig) {
    const configStr = formatRunConfig(props.instance.runConfig)
    const timeStr = props.instance.runConfig.time ? `${props.instance.runConfig.time}min` : '?'
    return `${baseName} (${levelText} ${level}) • ${configStr} • ${timeStr}`
  }
  
  return `${baseName} (${levelText} ${level})`
})
</script>

<template>
  <div :class="COLOR_CLASSES.card">
    <!-- Header clickable: toggles expand/collapse -->
    <div @click="emit('toggle')" class="cursor-pointer px-5 py-4 flex items-center justify-between gap-4">
      <div class="flex items-center gap-3 truncate">
        <div :class="['font-bold text-sm truncate', COLOR_CLASSES.textLight]">{{ instanceTitle }}</div>
      </div>

      <div class="flex items-center gap-4">
        <div :class="['font-bold text-lg', COLOR_CLASSES.textKamas]">{{ formatNumber(instance.totalKamas) }} ₭</div>
        <ExpandArrow :isExpanded="isExpanded" />
      </div>
    </div>

    <transition name="expand">
      <div v-if="isExpanded && instance.items && instance.items.length > 0" class="overflow-hidden">
        <ul :class="['divide-y divide-white/20', COLOR_CLASSES.bgSecondary]">
          <li v-for="(item, idx) in instance.items" :key="item.itemId" class="px-5 py-2 flex justify-between items-center">
            <div class="flex items-center gap-3">
              <div :class="COLOR_CLASSES.textNormal">
                <span :class="'font-bold'" :style="{ color: getRarityColor(item.rarity) }">{{ names.items[item.itemId] || ('#' + item.itemId) }}</span>
                <span> x{{ item.quantity }} ({{ (item.rate * 100).toFixed(1) }}%{{ getSteleInfo(item) }})</span>
              </div>
            </div>
            <div :class="['font-semibold', COLOR_CLASSES.textKamas]">{{ formatNumber(item.subtotal) }} ₭</div>
          </li>
        </ul>
      </div>
    </transition>
  </div>
</template>

<style scoped>
/* Smooth expand/collapse transition */
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  max-height: 2000px;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
}

.expand-enter-to,
.expand-leave-from {
  opacity: 1;
  max-height: 2000px;
}
</style>
