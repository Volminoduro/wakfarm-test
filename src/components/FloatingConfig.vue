<template>
  <div class="bg-slate-800 border-2 border-amber-500/30 rounded-lg shadow-xl p-2">
    <h2 class="text-2xl font-bold mb-2 text-amber-400">{{ t('config_title') }}</h2>

    <table class="w-full">
      <thead>
        <tr>
          <th class="text-center font-medium pb-2 text-amber-300 text-base">{{ t('config_modulated') }}</th>
          <th class="text-center font-medium pb-2 text-amber-300 text-base">{{ t('config_booster') }}</th>
          <th class="text-center font-medium pb-2 text-amber-300 text-base">{{ t('config_stasis') }}</th>
          <th class="text-center font-medium pb-2 text-amber-300 text-base">{{ t('config_steles') }}</th>
          <th class="text-center font-medium pb-2 text-amber-300 text-base">{{ t('config_stele_intervention') }}</th>
          <th class="text-center font-medium pb-2 text-amber-300 text-base">{{ t('config_server') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="text-center px-2">
            <input 
              id="booster"
              type="checkbox" 
              v-model="store.config.isBooster"
              class="w-6 h-6 accent-amber-500"
            />
          </td>
          <td class="text-center px-2">
            <input 
              id="isModulated"
              type="checkbox" 
              v-model="store.config.isModulated"
              class="w-6 h-6 accent-amber-500"
            />
          </td>
          <td class="text-center px-2">
            <div class="flex justify-center">
              <select 
                id="stasis"
                v-model.number="store.config.stasis" 
                class="border border-amber-500/30 bg-slate-700 text-slate-200 px-3 py-1 rounded text-base w-[65px] focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none"
              >
                <option v-for="n in 10" :key="n" :value="n">{{ n }}</option>
              </select>
            </div>
          </td>
          <td class="text-center px-2">
            <div class="flex justify-center">
              <select 
                id="steles"
                v-model.number="store.config.steles" 
                class="border border-amber-500/30 bg-slate-700 text-slate-200 px-3 py-1 rounded text-base w-[65px] focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none"
              >
                <option v-for="n in 5" :key="n" :value="n - 1">{{ n - 1 }}</option>
              </select>
            </div>
          </td>
          <td class="text-center px-2">
            <div class="flex justify-center">
              <select 
                id="steleIntervention"
                v-model.number="store.config.steleIntervention" 
                class="border border-amber-500/30 bg-slate-700 text-slate-200 px-3 py-1 rounded text-base w-[65px] focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none"
              >
                <option v-for="n in 4" :key="n" :value="n - 1">{{ n - 1 }}</option>
              </select>
            </div>
          </td>
          
          <td class="text-center px-2">
            <div class="flex justify-center">
              <select 
                id="server"
                v-model="store.config.server" 
                class="border border-amber-500/30 bg-slate-700 text-slate-200 px-3 py-1 rounded text-base w-[160px] focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none"
              >
                <option v-for="server in dataStore.servers" :key="server.id" :value="server.id">
                  {{ t(server.name_key) }}
                </option>
              </select>
            </div>
          </td>
        </tr>
        
        <!-- Second row: Filters -->
        <tr>
          <th class="text-center font-medium pb-2 pt-3 text-amber-300 text-base" colspan="2">{{ t('config_min_rate') }}</th>
          <th class="text-center font-medium pb-2 pt-3 text-amber-300 text-base" colspan="2">{{ t('config_min_profit') }}</th>          
          <th class="text-center font-medium pb-2 pt-3 text-amber-300 text-base" colspan="2">{{ t('config_min_total') }}</th>
        </tr>
        <tr>
          <td colspan="2" class="px-2">
            <div class="flex justify-center">
              <div class="input-wrapper" style="width: 80px;">
                <input
                  type="text"
                  :value="formatRateInput(store.config.minDropRatePercent)"
                  @input="updateMinDropRate"
                  class="border border-amber-500/30 bg-slate-700 text-slate-200 rounded px-5 py-1 text-base focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none rate-input-padding"
                  style="width: 80px;"
                />
                <span class="rate-icon">%</span>
              </div>
            </div>
          </td>
          <td colspan="2" class="px-2">
            <div class="flex justify-center">
              <div class="input-wrapper" style="width: 180px;">
                <input
                  type="text"
                  :value="formatInputNumber(store.config.minItemProfit)"
                  @input="updateMinItemProfit"
                  class="border border-amber-500/30 bg-slate-700 text-slate-200 rounded px-5 py-1 text-base focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none kamas-input-padding"
                  style="width: 180px;"
                />
                <span class="kamas-icon">₭</span>
              </div>
            </div>
          </td>
          <td colspan="2" class="px-2">
            <div class="flex justify-center">
              <div class="input-wrapper" style="width: 180px;">
                <input
                  type="text"
                  :value="formatInputNumber(store.config.minInstanceTotal)"
                  @input="updateMinInstanceTotal"
                  class="border border-amber-500/30 bg-slate-700 text-slate-200 rounded px-5 py-1 text-base focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none kamas-input-padding"
                  style="width: 180px;"
                />
                <span class="kamas-icon">₭</span>
              </div>
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
import { formatInputNumber, formatRateInput, parseFormattedNumber } from '../utils/formatters'

const store = useGlobalStore()
const dataStore = useDataStore()

const t = (key) => {
  return dataStore.names?.divers?.[key] || key
}

function updateMinItemProfit(event) {
  const value = parseFormattedNumber(event.target.value)
  if (value === '') {
    store.config.minItemProfit = null
    return
  }
  const numValue = parseInt(value, 10)
  store.config.minItemProfit = isNaN(numValue) ? null : numValue
}

function updateMinInstanceTotal(event) {
  const value = parseFormattedNumber(event.target.value)
  if (value === '') {
    store.config.minInstanceTotal = null
    return
  }
  const numValue = parseInt(value, 10)
  store.config.minInstanceTotal = isNaN(numValue) ? null : numValue
}

function updateMinDropRate(event) {
  const value = event.target.value.replace(',', '.').trim()
  if (value === '') {
    store.config.minDropRatePercent = null
    return
  }
  let numValue = parseFloat(value)
  if (isNaN(numValue)) {
    numValue = 0
  } else if (numValue > 100) {
    numValue = 100
  } else if (numValue < 0) {
    numValue = 0
  }
  store.config.minDropRatePercent = numValue
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

.kamas-input-padding {
  padding-right: 2.5rem !important;
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

.rate-input-padding {
  padding-right: 2rem !important;
}

.rate-icon {
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