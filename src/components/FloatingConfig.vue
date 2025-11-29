<template>
  <div class="bg-white border border-gray-200 rounded-lg shadow-md p-6">
    <h2 class="text-xl font-bold mb-6">Paramètres de Run</h2>

    <table class="w-full">
      <thead>
        <tr>
          <th class="text-center font-medium pb-4">Stasis</th>
          <th class="text-center font-medium pb-4">Stèles</th>
          <th class="text-center font-medium pb-4">Booster</th>
          <th class="text-center font-medium pb-4">Intervention</th>
          <th class="text-center font-medium pb-4">Serveur</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="text-center">
            <select 
              id="stasis"
              v-model.number="store.config.stasis" 
              class="border border-gray-300 px-3 py-2 rounded w-full"
            >
              <option v-for="n in 10" :key="n" :value="n">{{ n }}</option>
            </select>
          </td>
          <td class="text-center">
            <select 
              id="steles"
              v-model.number="store.config.steles" 
              class="border border-gray-300 px-3 py-2 rounded w-full"
            >
              <option v-for="n in 5" :key="n" :value="n - 1">{{ n - 1 }}</option>
            </select>
          </td>
          <td class="text-center">
            <input 
              id="booster"
              type="checkbox" 
              v-model="store.config.isBooster"
              class="w-5 h-5"
            />
          </td>
          <td class="text-center">
            <input 
              id="intervention"
              type="checkbox" 
              v-model="store.config.intervention"
              class="w-5 h-5"
            />
          </td>
          <td class="text-center">
            <select 
              id="server"
              v-model="store.config.server" 
              class="border border-gray-300 px-3 py-2 rounded w-full"
            >
              <option value="pandora">Pandora</option>
              <option value="ogrest">Ogrest</option>
              <option value="neo-ogrest">Néo-Ogrest</option>
              <option value="neo-pandora">Néo-Pandora</option>
            </select>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { useGlobalStore } from '../stores/useGlobalStore'
const store = useGlobalStore()
</script>

<style scoped>
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
input[type=number] {
  -moz-appearance: textfield;
}
</style>