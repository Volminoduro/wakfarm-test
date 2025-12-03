<script setup>
import { computed } from 'vue'
import { formatNumber } from '../utils/formatters'
import { formatRunConfig } from '../utils/runHelpers'
import { RARITY_COLORS } from '../constants'
import { COLOR_CLASSES } from '../constants/colors'

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

function getSteleInfo(item) {
  const parts = []
  if (item.stele > 0) {
    parts.push(`st. ${item.stele}`)
  }
  if (item.steleIntervention > 0) {
    parts.push(`st.i. ${item.steleIntervention}`)
  }
  return parts.length > 0 ? ', ' + parts.join(', ') : ''
}

function getRarityColor(rarity) {
  return RARITY_COLORS[rarity] || RARITY_COLORS[0]
}
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
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
          :class="[isExpanded ? 'rotate-down' : '', 'transition-transform', COLOR_CLASSES.textPrimary]">
          <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" fill="currentColor"/>
        </svg>
      </div>
    </div>

    <transition name="slide">
      <ul v-if="isExpanded && instance.items && instance.items.length > 0" :class="['divide-y divide-white/20', COLOR_CLASSES.bgSecondary]">
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
    </transition>
  </div>
</template>

<style scoped>
/* Slide down/up animation using opacity only for better performance */
.slide-enter-active, .slide-leave-active {
  transition: opacity 100ms ease;
}
.slide-enter-from, .slide-leave-to {
  opacity: 0;
}
.slide-enter-to, .slide-leave-from {
  opacity: 1;
}

.rotate-down {
  transform: rotate(90deg);
}
</style>
