<template>
  <div class="bg-white border border-gray-200 rounded-lg shadow-md p-6">
    <h2 class="text-xl font-bold mb-6">{{ t('config_title') }}</h2>

    <table class="w-full">
      <thead>
        <tr>
          <th class="text-center font-medium pb-4">{{ t('config_modulated') }}</th>
          <th class="text-center font-medium pb-4">{{ t('config_stasis') }}</th>
          <th class="text-center font-medium pb-4">{{ t('config_steles') }}</th>
          <th class="text-center font-medium pb-4">{{ t('config_stele_intervention') }}</th>
          <th class="text-center font-medium pb-4">{{ t('config_booster') }}</th>
          <th class="text-center font-medium pb-4">{{ t('config_server') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="text-center">
            <input 
              id="booster"
              type="checkbox" 
              v-model="store.config.isBooster"
              class="w-5 h-5"
            />
          </td>
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
            <select 
              id="steleIntervention"
              v-model.number="store.config.steleIntervention" 
              class="border border-gray-300 px-3 py-2 rounded w-full"
            >
              <option v-for="n in 4" :key="n" :value="n - 1">{{ n - 1 }}</option>
            </select>
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
        
        <!-- Second row: Filters -->
        <tr>
          <th class="text-center font-medium pb-2 pt-4" colspan="3">{{ t('config_min_profit') }}</th>
          <th class="text-center font-medium pb-2 pt-4" colspan="2">{{ t('config_min_rate') }}</th>
          <th class="text-center font-medium pb-2 pt-4">{{ t('config_min_total') }}</th>
        </tr>
        <tr>
          <td colspan="3">
            <div class="input-wrapper">
              <input
                type="text"
                :value="formatInputNumber(store.config.minItemProfit)"
                @input="updateMinItemProfit"
                class="border border-gray-300 rounded w-full kamas-input"
              />
              <span class="kamas-icon">₭</span>
            </div>
          </td>
          <td colspan="2">
            <input
              type="number"
              v-model.number="store.config.minDropRatePercent"
              min="0"
              max="100"
              step="0.1"
              class="border border-gray-300 px-3 py-2 rounded w-full"
            />
          </td>
          <td>
            <div class="input-wrapper">
              <input
                type="text"
                :value="formatInputNumber(store.config.minInstanceTotal)"
                @input="updateMinInstanceTotal"
                class="border border-gray-300 rounded w-full kamas-input"
              />
              <span class="kamas-icon">₭</span>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
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

function formatInputNumber(num) {
  if (num === null || num === undefined || num === '' || num === 0) return ''
  return new Intl.NumberFormat('fr-FR').format(num)
}

function updateMinItemProfit(event) {
  const value = event.target.value.replace(/\s/g, '').replace(/\u202F/g, '')
  if (value === '') {
    store.config.minItemProfit = 0
    return
  }
  const numValue = parseInt(value, 10)
  store.config.minItemProfit = isNaN(numValue) ? 0 : numValue
}

function updateMinInstanceTotal(event) {
  const value = event.target.value.replace(/\s/g, '').replace(/\u202F/g, '')
  if (value === '') {
    store.config.minInstanceTotal = 0
    return
  }
  const numValue = parseInt(value, 10)
  store.config.minInstanceTotal = isNaN(numValue) ? 0 : numValue
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

.input-wrapper {
  position: relative;
  display: block;
  width: 100%;
}

.kamas-input {
  padding: 0.5rem 2rem 0.5rem 0.75rem;
  line-height: 1.5;
}

.kamas-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  margin-top: -0.5em;
  color: #9CA3AF;
  pointer-events: none;
  font-size: 14px;
  font-weight: 500;
  line-height: 1;
}
</style>