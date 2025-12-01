<template>
  <div class="bg-white border border-gray-200 rounded-lg shadow-md p-6">
    <h2 class="text-xl font-bold mb-6">{{ t('config_title') }}</h2>

    <table class="w-full">
      <thead>
        <tr>
          <th class="text-center font-medium pb-4">{{ t('config_stasis') }}</th>
          <th class="text-center font-medium pb-4">{{ t('config_steles') }}</th>
            <th class="text-center font-medium pb-4">{{ t('config_booster') }}</th>
              <th class="text-center font-medium pb-4">{{ t('config_modulated') }}</th>
              <th class="text-center font-medium pb-4">{{ t('config_intervention') }}</th>
              <th class="text-center font-medium pb-4">{{ t('config_server') }}</th>
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
              id="isModulated"
              type="checkbox" 
              v-model="store.config.isModulated"
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
              <option value="pandora">{{ t('server_pandora') }}</option>
              <option value="ogrest">{{ t('server_ogrest') }}</option>
              <option value="neo-ogrest">{{ t('server_neo_ogrest') }}</option>
              <option value="neo-pandora">{{ t('server_neo_pandora') }}</option>
            </select>
          </td>
        </tr>
      </tbody>
    </table>
    
    <!-- Filters: two extra lines -->
    <div class="mt-4">
      <div class="grid grid-cols-2 gap-4 mb-3">
        <!-- Min item profit -->
        <div>
          <label class="text-sm font-medium">{{ t('config_min_profit') }}</label>
          <input
            type="number"
            v-model.number="store.config.minItemProfit"
            min="0"
            step="1"
            class="mt-1 block w-full border border-gray-300 px-3 py-2 rounded"
          />
        </div>

        <!-- Min drop rate (percent) -->
        <div>
          <label class="text-sm font-medium">{{ t('config_min_rate') }}</label>
          <input
            type="number"
            v-model.number="store.config.minDropRatePercent"
            min="0"
            max="100"
            step="0.1"
            class="mt-1 block w-full border border-gray-300 px-3 py-2 rounded"
          />
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4">
        <!-- Min instance total -->
        <div>
          <label class="text-sm font-medium">{{ t('config_min_total') }}</label>
          <input
            type="number"
            v-model.number="store.config.minInstanceTotal"
            min="0"
            step="1"
            class="mt-1 block w-1/2 border border-gray-300 px-3 py-2 rounded"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useGlobalStore } from '../stores/useGlobalStore'
import { useDataStore } from '../stores/useDataStore'

const store = useGlobalStore()
const dataStore = useDataStore()

const t = (key) => {
  return dataStore.names?.divers?.[key] || key
}
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