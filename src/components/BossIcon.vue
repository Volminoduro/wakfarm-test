<script setup>
import { computed } from 'vue';
const props = defineProps({
  bossId: {
    type: [Number, String],
    required: true
  },
  size: {
    type: Number,
    default: 32
  }
})
const bossIconUrl = computed(() => {
  try {
    return new URL(`../assets/boss/${props.bossId}.png`, import.meta.url).href;
  } catch {
    return '';
  }
});
</script>
<template>
  <img
    v-if="bossId && bossId > 0"
    :src="bossIconUrl"
    :alt="'Boss'"
    :height="'32px'"
    class="object-contain flex-shrink-0"
    style="max-height:32px;"
    @error="$event.target.style.display='none'"
  />
</template>
