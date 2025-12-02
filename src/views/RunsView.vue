<template>
  <div class="px-8 py-6 max-w-[1920px] mx-auto">
    <div class="bg-[#1e2026] border border-amber-500/30 rounded-lg p-6 mb-4">
      <h2 class="text-2xl font-bold text-amber-400 mb-4">Gestion des Runs</h2>
      <p class="text-slate-300">Work in progress: Suivi et historique des runs</p>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div class="bg-[#1e2026] border border-amber-500/30 rounded-lg p-4">
        <h3 class="text-xl text-amber-300 mb-2">Carte de test 1</h3>
        <p class="text-slate-300">Ceci est du contenu de test pour vérifier l'affichage</p>
      </div>
      <div class="bg-[#1e2026] border border-amber-500/30 rounded-lg p-4">
        <h3 class="text-xl text-amber-300 mb-2">Carte de test 2</h3>
        <p class="text-slate-300">Ceci est du contenu de test pour vérifier l'affichage</p>
      </div>
      <div class="bg-[#1e2026] border border-amber-500/30 rounded-lg p-4">
        <h3 class="text-xl text-amber-300 mb-2">Carte de test 3</h3>
        <p class="text-slate-300">Ceci est du contenu de test pour vérifier l'affichage</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// État pour la gestion des runs
const runs = ref([])
</script>
