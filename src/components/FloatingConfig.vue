<script setup>
import { useGlobalStore } from '../stores/useGlobalStore'
import { useDataStore } from '../stores/useDataStore'
import { formatInputNumber, formatRateInput, parseFormattedNumber } from '../utils/formatters'
import { COLOR_CLASSES } from '../constants/colors'
import LevelRangeFilter from './LevelRangeFilter.vue'

const store = useGlobalStore()
const dataStore = useDataStore()

const t = (key) => dataStore.names?.divers?.[key] || key

// Generic numeric field updater
const updateNumericField = (event, fieldName, parser = parseInt) => {
  const value = parseFormattedNumber(event.target.value)
  store.config[fieldName] = value === '' ? null : parser(value, 10) || null
}

// Specific field updaters
const updateMinItemProfit = (e) => updateNumericField(e, 'minItemProfit')
const updateMinInstanceTotal = (e) => updateNumericField(e, 'minInstanceTotal')

// Drop rate updater with percentage constraints
function updateMinDropRate(event) {
  const value = event.target.value.replace(',', '.').trim()
  
  if (value === '') {
    store.config.minDropRatePercent = null
    return
  }
  
  const parsedValue = parseFloat(value)
  if (isNaN(parsedValue)) {
    store.config.minDropRatePercent = null
    return
  }
  
  const clampedValue = Math.max(0, Math.min(100, parsedValue))
  store.config.minDropRatePercent = clampedValue
  
  // Update input if value was clamped
  if (parsedValue !== clampedValue) {
    event.target.value = clampedValue.toString()
  }
}
</script>

<template>
  <div :class="COLOR_CLASSES.configBg" class="p-2">
    <h2 :class="['text-2xl mb-2', COLOR_CLASSES.titlePrimary]">{{ t('config_title') }}</h2>

    <table class="w-full" style="table-layout: fixed;">
      <thead>
        <tr>
          <th :class="['text-center font-medium pb-2 text-base', COLOR_CLASSES.textSecondary]">{{ t('config_modulated') }}</th>
          <th :class="['text-center font-medium pb-2 text-base', COLOR_CLASSES.textSecondary]">{{ t('config_booster') }}</th>
          <th :class="['text-center font-medium pb-2 text-base', COLOR_CLASSES.textSecondary]">{{ t('config_stasis') }}</th>
          <th :class="['text-center font-medium pb-2 text-base', COLOR_CLASSES.textSecondary]">{{ t('config_steles') }}</th>
          <th :class="['text-center font-medium pb-2 text-base', COLOR_CLASSES.textSecondary]">{{ t('config_stele_intervention') }}</th>
          <th :class="['text-center font-medium pb-2 text-base', COLOR_CLASSES.textSecondary]">{{ t('config_server') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="text-center">
            <input 
              id="booster"
              type="checkbox" 
              v-model="store.config.isBooster"
              class="custom-checkbox"
            />
          </td>
          <td class="text-center">
            <input 
              id="isModulated"
              type="checkbox" 
              v-model="store.config.isModulated"
              class="custom-checkbox"
            />
          </td>
          <td class="text-center">
            <select 
              id="stasis"
              v-model.number="store.config.stasis"
              :class="[COLOR_CLASSES.select, 'w-[65px]']"
            >
              <option v-for="n in 10" :key="n" :value="n">{{ n }}</option>
            </select>
          </td>
          <td class="text-center">
            <select 
              id="steles"
              v-model.number="store.config.steles"
              :class="[COLOR_CLASSES.select, 'w-[65px]']"
            >
              <option v-for="n in 5" :key="n" :value="n - 1">{{ n - 1 }}</option>
            </select>
          </td>
          <td class="text-center">
            <select 
              id="steleIntervention"
              v-model.number="store.config.steleIntervention"
              :class="[COLOR_CLASSES.select, 'w-[65px]']"
            >
              <option v-for="n in 4" :key="n" :value="n - 1">{{ n - 1 }}</option>
            </select>
          </td>
          <td class="text-center">
            <div class="flex items-center justify-center gap-2">
              <select 
                id="server"
                v-model="store.config.server"
                :class="[COLOR_CLASSES.select, 'w-[160px]']"
              >
                <option v-for="server in dataStore.servers" :key="server.id" :value="server.id">
                  {{ t(server.name_key) }}
                </option>
              </select>
              <div :class="['text-xs leading-tight w-[70px] text-center', COLOR_CLASSES.textMuted]">
                <div v-if="dataStore.pricesLastUpdate">
                  <div>{{ dataStore.pricesLastUpdate.split(' ')[0] }}</div>
                  <div>{{ dataStore.pricesLastUpdate.split(' ')[1] }}</div>
                </div>
                <span v-else>{{ t('prices_no_data') }}</span>
              </div>
            </div>
          </td>
        </tr>
        
        <!-- Second row: Filters -->
        <tr>
          <th :class="['text-center font-medium pb-2 pt-3 text-base', COLOR_CLASSES.textSecondary]">{{ t('config_min_rate') }}</th>
          <th :class="['text-center font-medium pb-2 pt-3 text-base', COLOR_CLASSES.textSecondary]" colspan="2">{{ t('config_min_profit') }}</th>
          <th :class="['text-center font-medium pb-2 pt-3 text-base', COLOR_CLASSES.textSecondary]" colspan="2">{{ t('config_min_total') }}</th>
          <th :class="['text-center font-medium pb-2 pt-3 text-base', COLOR_CLASSES.textSecondary]">{{ t('level_ranges_title') }}</th>
        </tr>
        <tr>
          <td class="text-center">
            <div class="input-wrapper" style="width: 70px; margin: 0 auto;">
              <input
                type="text"
                :value="formatRateInput(store.config.minDropRatePercent)"
                @input="updateMinDropRate"
                :class="[COLOR_CLASSES.input, 'rounded px-2 py-1 rate-input-padding']"
                style="width: 70px;"
              />
              <span class="rate-icon">%</span>
            </div>
          </td>
          <td colspan="2" class="text-center">
            <div class="input-wrapper" style="width: 140px; margin: 0 auto;">
              <input
                type="text"
                :value="formatInputNumber(store.config.minItemProfit)"
                @input="updateMinItemProfit"
                :class="[COLOR_CLASSES.input, 'rounded px-2 py-1 kamas-input-padding']"
                style="width: 140px;"
              />
              <span class="kamas-icon">₭</span>
            </div>
          </td>
          <td colspan="2" class="text-center">
            <div class="input-wrapper" style="width: 140px; margin: 0 auto;">
              <input
                type="text"
                :value="formatInputNumber(store.config.minInstanceTotal)"
                @input="updateMinInstanceTotal"
                :class="[COLOR_CLASSES.input, 'rounded px-2 py-1 kamas-input-padding']"
                style="width: 140px;"
              />
              <span class="kamas-icon">₭</span>
            </div>
          </td>
          <td class="text-center">
            <div style="width: 160px; margin: 0 auto;">
              <LevelRangeFilter />
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>



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

.rate-input-padding {
  padding-right: 2rem !important;
}

.kamas-icon,
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

/* Custom checkbox styling */
.custom-checkbox {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  width: 24px;
  height: 24px;
  border: 2px solid rgba(211, 253, 56, 0.4);
  border-radius: 4px;
  background-color: #334155;
  cursor: pointer;
  position: relative;
  transition: all 0.15s ease;
}

.custom-checkbox:hover {
  border-color: rgba(211, 253, 56, 0.6);
}

.custom-checkbox:checked {
  background-color: #d3fd38;
  border-color: #d3fd38;
}

.custom-checkbox:focus {
  outline: none;
  ring: 1px;
  ring-color: #d3fd38;
  border-color: #d3fd38;
}
</style>