<template>
  <div class="border-2 border-amber-500 rounded-lg shadow-lg hover:shadow-xl transition bg-slate-800 overflow-hidden hover:border-amber-400">
    <!-- Header clickable: toggles expand/collapse -->
    <div @click="emit('toggle')" class="cursor-pointer px-4 py-3 flex items-center justify-between gap-4">
      <div class="flex items-center gap-3 truncate">
        <div class="font-bold truncate text-slate-200">{{ names.instances[instance.id] || ('Instance ' + instance.id) }} ({{ names.divers['niveau_reduit'] }} {{ instance.level }})</div>
      </div>

      <div class="flex items-center gap-4">
        <div class="text-amber-400 font-bold text-lg">{{ formatNumber(instance.totalKamas) }} ₭</div>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
          :class="isExpanded ? 'rotate-90' : ''" class="transition-transform text-amber-400">
          <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" fill="currentColor"/>
        </svg>
      </div>
    </div>

    <transition name="slide">
      <div v-if="isExpanded" class="px-4 py-3 bg-slate-900/50">
        <ul class="divide-y divide-slate-700">
          <li v-for="(item, idx) in instance.items" :key="item.itemId" class="py-2 flex justify-between items-center">
            <div class="flex items-center gap-3">
              <div class="font-medium text-slate-300">
                <span class="font-bold" :style="{ color: getRarityColor(item.rarity) }">{{ names.items[item.itemId] || ('#' + item.itemId) }}</span>
                <span> x{{ item.quantity }} ({{ (item.rate * 100).toFixed(1) }}%{{ getSteleInfo(item) }})</span>
              </div>
            </div>
            <div class="font-semibold text-amber-300">{{ formatNumber(item.subtotal) }} ₭</div>
          </li>
        </ul>
      </div>
    </transition>
  </div>
</template>

<script setup>
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

function formatNumber(num) {
  return new Intl.NumberFormat('fr-FR').format(num)
}

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
  const colors = {
    0: '#FFFFFF',
    1: '#FFFFFF',
    2: '#00EE8C',
    3: '#FF913C',
    4: '#FFDF78',
    5: '#6A42A2',
    6: '#8DC6E1',
    7: '#FF88B8'
  }
  return colors[rarity] || '#FFFFFF'
}
</script>

<style scoped>
/* Slide down/up animation using max-height */
.slide-enter-active, .slide-leave-active {
  transition: max-height 300ms ease, opacity 200ms ease;
}
.slide-enter-from, .slide-leave-to {
  max-height: 0;
  opacity: 0;
}
.slide-enter-to, .slide-leave-from {
  max-height: 800px; /* big enough for the content */
  opacity: 1;
}

.rotate-90 {
  transform: rotate(90deg);
}
</style>
