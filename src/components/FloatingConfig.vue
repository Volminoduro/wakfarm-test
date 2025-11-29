<template>
  <div class="fixed top-0 left-0 w-full bg-blue-900 text-white p-4 shadow-lg z-50 flex gap-4 items-center">
    <div class="font-bold text-xl">WakFarm</div>
    
    <div class="flex gap-2 items-center">
      <label>Stasis:</label>
      <input type="number" v-model="store.config.stasis" min="1" max="50" class="text-black w-16 px-2 rounded"/>
    </div>

    <div class="flex gap-2 items-center">
      <label>Stèles:</label>
      <select v-model="store.config.steles" class="text-black px-2 rounded">
        <option :value="0">0</option>
        <option :value="1">1</option>
        <option :value="2">2</option>
        <option :value="3">3</option>
      </select>
    </div>

    <div class="flex gap-2 items-center">
      <input type="checkbox" v-model="store.config.isBooster" id="booster"/>
      <label for="booster">Booster</label>
    </div>
  </div>
  <div class="h-20"></div> 
</template>

<script setup>
import { useGlobalStore } from '../stores/useGlobalStore'
const store = useGlobalStore()
</script>