<template>
  <div class="px-8 py-6 max-w-[1920px] mx-auto">
    <div class="bg-slate-800 border border-amber-500/30 rounded-lg p-6 mb-4">
      <h2 class="text-2xl font-bold text-amber-400 mb-4">Gestion des Prix</h2>
      <p class="text-slate-300">Work in progress: Édition et gestion des prix personnalisés</p>
    </div>
    
    <div class="bg-slate-800 border border-amber-500/30 rounded-lg p-6">
      <h3 class="text-xl text-amber-300 mb-4">Liste de prix de test</h3>
      <div class="space-y-2">
        <div class="flex justify-between items-center p-3 bg-slate-700 rounded">
          <span class="text-slate-200">Item de test 1</span>
          <span class="text-amber-400 font-bold">1000 ₭</span>
        </div>
        <div class="flex justify-between items-center p-3 bg-slate-700 rounded">
          <span class="text-slate-200">Item de test 2</span>
          <span class="text-amber-400 font-bold">5000 ₭</span>
        </div>
        <div class="flex justify-between items-center p-3 bg-slate-700 rounded">
          <span class="text-slate-200">Item de test 3</span>
          <span class="text-amber-400 font-bold">10000 ₭</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// État pour la gestion des prix
const customPrices = ref({})
</script>
