<script setup>
import BossIcon from './BossIcon.vue'
import ExpandArrow from './ExpandArrow.vue'
import { COLOR_CLASSES } from '../constants/colors'
import { formatNumber } from '../utils/formatters'

const props = defineProps({
  bossId: [Number, String],
  title: String,
  totalKamas: Number,
  isExpanded: Boolean,
  clickable: Boolean,
})
const emit = defineEmits(['toggle'])
</script>
<template>
  <div :class="COLOR_CLASSES.card">
    <div
      @click="clickable !== false ? emit('toggle') : undefined"
      :class="['px-5 py-4 flex items-center justify-between gap-4', clickable !== false ? 'cursor-pointer' : '']"
    >
      <div class="flex items-center gap-3 truncate">
        <BossIcon :boss-id="bossId" :size="32" />
        <div :class="['font-bold text-sm truncate', COLOR_CLASSES.textLight]">{{ title }}</div>
      </div>
      <div class="flex items-center gap-4 flex-shrink-0">
        <div :class="['font-bold text-lg whitespace-nowrap', COLOR_CLASSES.textKamas]">{{ formatNumber(totalKamas) }} ₭</div>
        <ExpandArrow v-if="typeof isExpanded === 'boolean'" :isExpanded="isExpanded" />
      </div>
    </div>
    <slot />
  </div>
</template>
