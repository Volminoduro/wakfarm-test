<template>
  <div>
    <!-- Kamas / Run -->
    <div v-if="subTab === 'run'" class="px-8 py-6 max-w-[1920px] mx-auto">
      <div v-if="!dataStore.loaded" class="text-center">
        <p class="text-amber-400 text-lg">Chargement des données...</p>
      </div>
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
        <InstanceCard 
          v-for="inst in sortedInstances" 
          :key="inst.id"
          :instance="inst"
          :isExpanded="expanded.has(inst.id)"
          :names="dataStore.names"
          @toggle="toggleExpand(inst.id)"
        />
      </div>
    </div>

    <!-- Kamas / Heure -->
    <div v-else class="px-8 py-6 max-w-[1920px] mx-auto">
      <p class="mb-4 text-slate-300">Vos configurations personnalisées (Sauvegardées localement)</p>
      <div class="bg-slate-800 border border-amber-500/30 rounded-lg p-4">
        <p class="text-slate-300">Work in progress: Configuration horaire</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue'
import { useDataStore } from '../stores/useDataStore'
import InstanceCard from '../components/InstanceCard.vue'

defineProps({
  subTab: {
    type: String,
    required: true
  },
  expanded: {
    type: Set,
    required: true
  }
})

const emit = defineEmits(['toggleExpand'])

const dataStore = useDataStore()

// Calculer et trier les instances dynamiquement
const sortedInstances = computed(() => {
  if (!dataStore.loaded) return []
  return dataStore.instancesRefined
    .map(inst => ({ ...inst }))
    .sort((a, b) => (b.totalKamas || 0) - (a.totalKamas || 0))
})

function toggleExpand(id) {
  emit('toggleExpand', id)
}
</script>

<style scoped>
</style>