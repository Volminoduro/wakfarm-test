<template>
  <div class="px-8 py-6 max-w-[1920px] mx-auto">
    <div class="bg-slate-800 border border-amber-500/30 rounded-lg p-6">
      <h2 class="text-2xl font-bold text-amber-400 mb-4">Gestion des Runs</h2>
      <p class="text-slate-300">Work in progress: Suivi et historique des runs</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// État pour la gestion des runs
const runs = ref([])
</script>
