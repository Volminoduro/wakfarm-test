<template>
  <div class="px-8 py-6 max-w-[1920px] mx-auto">
    <!-- Filters and Pagination Controls -->
    <div :class="[COLOR_CLASSES.bgSecondary, 'border-2 border-[#363634] rounded-lg', 'rounded-lg p-4 mb-4']">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <!-- Search by name -->
        <div class="relative" ref="searchDropdownRef">
          <label :class="['block text-sm font-medium mb-2', COLOR_CLASSES.textSecondary]">{{ t('prices_search_name') }}</label>
          <input
            v-model="searchName"
            @input="onSearchInput"
            @focus="showAutocomplete = true"
            type="text"
            :placeholder="t('prices_search_placeholder')"
            :class="[COLOR_CLASSES.input, 'w-full rounded px-3 py-2']"
          />
          
          <div v-if="showAutocomplete && autocompleteItems.length > 0" 
               :class="['absolute z-10 mt-1 w-full rounded shadow-lg max-h-64 overflow-y-auto', COLOR_CLASSES.bgSecondary, COLOR_CLASSES.borderCard]">
            <div class="p-1">
              <button
                v-for="item in autocompleteItems"
                :key="item.id"
                @click="selectItem(item)"
                class="w-full text-left px-3 py-2 hover:bg-slate-700/50 rounded transition-colors">
                <span :style="{ color: getRarityColor(item.rarity) }" class="font-bold">
                  {{ item.name }}
                </span>
                <span :class="COLOR_CLASSES.textMuted" class="text-sm ml-2">
                  ({{ t('prices_col_level') }} {{ item.level }})
                </span>
              </button>
            </div>
          </div>
        </div>
        
        <!-- Filter by rarity -->
        <div class="relative" ref="rarityDropdownRef">
          <label :class="['block text-sm font-medium mb-2', COLOR_CLASSES.textSecondary]">{{ t('prices_filter_rarity') }}</label>
          <button
            @click="isRarityDropdownOpen = !isRarityDropdownOpen"
            :class="[COLOR_CLASSES.select, 'w-full text-left flex items-center justify-between font-mono']"
            style="min-width: 160px;">
            <span>{{ getRarityDisplayText() }}</span>
            <span>{{ isRarityDropdownOpen ? '▲' : '▼' }}</span>
          </button>
          
          <div v-if="isRarityDropdownOpen" 
               :class="['absolute z-10 mt-1 w-full rounded shadow-lg max-h-64 overflow-y-auto', COLOR_CLASSES.bgSecondary, COLOR_CLASSES.borderCard]">
            <div class="p-2 space-y-1">
              <div class="flex gap-2 mb-2 pb-2 border-b border-slate-700">
                <button 
                  @click="toggleAllRarities(true)"
                  :class="['flex-1 px-2 py-1 text-xs rounded transition-colors', COLOR_CLASSES.button, COLOR_CLASSES.textSecondary]">
                  {{ t('level_ranges_toggle_all') }}
                </button>
                <button 
                  @click="toggleAllRarities(false)"
                  :class="['flex-1 px-2 py-1 text-xs rounded transition-colors', COLOR_CLASSES.button, COLOR_CLASSES.textSecondary]">
                  {{ t('level_ranges_toggle_none') }}
                </button>
              </div>
              
              <label 
                v-for="r in 8" 
                :key="r-1"
                class="flex items-center gap-2 px-2 py-1 hover:bg-slate-700/50 rounded cursor-pointer">
                <input
                  type="checkbox"
                  :checked="filterRarities.includes(r-1)"
                  @change="toggleRarity(r-1)"
                  class="custom-checkbox-small"
                />
                <span :style="{ color: getRarityColor(r-1) }">
                  {{ getRarityName(r-1) }}
                </span>
              </label>
            </div>
          </div>
        </div>
        
        <!-- Filter by level -->
        <div>
          <label :class="['block text-sm font-medium mb-2', COLOR_CLASSES.textSecondary]">{{ t('prices_filter_level') }}</label>
          <div class="flex gap-2">
            <input
              v-model.number="filterLevelMin"
              @input="validateLevelMin"
              type="number"
              min="1"
              max="245"
              :placeholder="t('prices_min')"
              :class="[COLOR_CLASSES.input, 'w-full rounded px-3 py-2']"
            />
            <input
              v-model.number="filterLevelMax"
              @input="validateLevelMax"
              type="number"
              min="1"
              max="245"
              :placeholder="t('prices_max')"
              :class="[COLOR_CLASSES.input, 'w-full rounded px-3 py-2']"
            />
          </div>
        </div>
        
        <!-- Filter by instances -->
        <div class="relative" ref="instancesDropdownRef">
          <label :class="['block text-sm font-medium mb-2', COLOR_CLASSES.textSecondary]">{{ t('prices_filter_instances') }}</label>
          <button
            @click="isInstancesDropdownOpen = !isInstancesDropdownOpen"
            :class="[COLOR_CLASSES.select, 'w-full text-left flex items-center justify-between font-mono']"
            style="min-width: 160px;">
            <span>{{ getInstancesDisplayText() }}</span>
            <span>{{ isInstancesDropdownOpen ? '▲' : '▼' }}</span>
          </button>
          
          <div v-if="isInstancesDropdownOpen" 
               :class="['absolute z-10 mt-1 w-full rounded shadow-lg max-h-64 overflow-y-auto', COLOR_CLASSES.bgSecondary, COLOR_CLASSES.borderCard]">
            <div class="p-2 space-y-1">
              <div class="flex gap-2 mb-2 pb-2 border-b border-slate-700">
                <button 
                  @click="toggleAllInstances(true)"
                  :class="['flex-1 px-2 py-1 text-xs rounded transition-colors', COLOR_CLASSES.button, COLOR_CLASSES.textSecondary]">
                  {{ t('level_ranges_toggle_all') }}
                </button>
                <button 
                  @click="toggleAllInstances(false)"
                  :class="['flex-1 px-2 py-1 text-xs rounded transition-colors', COLOR_CLASSES.button, COLOR_CLASSES.textSecondary]">
                  {{ t('level_ranges_toggle_none') }}
                </button>
              </div>
              
              <label 
                v-for="inst in allInstancesList" 
                :key="inst.id"
                class="flex items-center gap-2 px-2 py-1 hover:bg-slate-700/50 rounded cursor-pointer">
                <input
                  type="checkbox"
                  :checked="filterInstances.includes(inst.id)"
                  @change="toggleInstance(inst.id)"
                  class="custom-checkbox-small"
                />
                <span :class="COLOR_CLASSES.textNormal">
                  {{ inst.name }}
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Items per page selector -->
      <div class="flex items-center gap-4">
        <label :class="['text-sm font-medium', COLOR_CLASSES.textSecondary]">{{ t('prices_per_page') }}</label>
        <select
          v-model.number="itemsPerPage"
          :class="[COLOR_CLASSES.select]">
          <option :value="25">25</option>
          <option :value="50">50</option>
          <option :value="100">100</option>
          <option :value="200">200</option>
        </select>
      </div>
    </div>
    
    <!-- Table -->
    <div :class="[COLOR_CLASSES.card]">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead :class="['font-bold truncate', COLOR_CLASSES.textLight]">
            <tr>
              <th @click="sortBy('name')" :class="['px-4 py-3 text-left cursor-pointer select-none', 'hover:bg-[#4e4839]']">
                <div class="flex items-center gap-2">
                  {{ t('prices_col_name') }}
                  <span v-if="sortColumn === 'name'">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span>
                </div>
              </th>
              <th @click="sortBy('level')" :class="['px-4 py-3 text-left cursor-pointer select-none', 'hover:bg-[#4e4839]']">
                <div class="flex items-center gap-2">
                  {{ t('prices_col_level') }}
                  <span v-if="sortColumn === 'level'">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span>
                </div>
              </th>
              <th @click="sortBy('instances')" :class="['px-4 py-3 text-left cursor-pointer select-none', 'hover:bg-[#4e4839]']">
                <div class="flex items-center gap-2">
                  {{ t('prices_col_instances') }}
                  <span v-if="sortColumn === 'instances'">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span>
                </div>
              </th>
              <th @click="sortBy('price')" :class="['px-4 py-3 text-right cursor-pointer select-none', 'hover:bg-[#4e4839]']">
                <div class="flex items-center justify-end gap-2">
                  {{ t('prices_col_price') }}
                  <span v-if="sortColumn === 'price'">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="item in paginatedItems" 
              :key="item.id"
              :class="['border-t border-[#363634] hover:border-[#625946] transition-colors']">
              <td class="px-4 py-3">
                <span :style="{ color: getRarityColor(item.rarity) }" class="font-bold">
                  {{ item.name }}
                </span>
              </td>
              <td :class="['px-4 py-3', COLOR_CLASSES.textNormal]">{{ item.level }}</td>
              <td :class="['px-4 py-3', COLOR_CLASSES.textSecondary]">
                <span v-if="item.instances && item.instances.length > 0" class="text-sm">
                  {{ item.instances.join(', ') }}
                </span>
                <span v-else :class="COLOR_CLASSES.textMuted">—</span>
              </td>
              <td :class="['px-4 py-3 text-right', COLOR_CLASSES.textKamas]">
                <span v-if="item.price != null">{{ formatNumber(item.price) }} ₭</span>
                <span v-else :class="COLOR_CLASSES.textMuted">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- Footer with pagination -->
      <div :class="['px-4 py-3 border-t border-[#363634]', COLOR_CLASSES.textLight,  'flex items-center justify-between']">
        <p :class="['text-sm']">
          {{ t('prices_showing') }} {{ startItem }} - {{ endItem }} {{ t('prices_of') }} {{ filteredAndSortedItems.length }} {{ t('prices_items') }}
        </p>
        
        <div class="flex items-center gap-2">
          <button
            @click="currentPage = 1"
            :disabled="currentPage === 1"
            :class="['px-3 py-1 rounded transition-colors', currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#4e4839]']">
            ««
          </button>
          <button
            @click="currentPage--"
            :disabled="currentPage === 1"
            :class="['px-3 py-1 rounded transition-colors', currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#4e4839]']">
            ‹
          </button>
          
          <span :class="['px-4 text-sm', COLOR_CLASSES.textNormal]">
            {{ t('prices_page') }} {{ currentPage }} / {{ totalPages }}
          </span>
          
          <button
            @click="currentPage++"
            :disabled="currentPage === totalPages"
            :class="['px-3 py-1 rounded transition-colors', currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#4e4839]']">
            ›
          </button>
          <button
            @click="currentPage = totalPages"
            :disabled="currentPage === totalPages"
            :class="['px-3 py-1 rounded transition-colors', currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#4e4839]']">
            »»
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useGlobalStore } from '../stores/useGlobalStore'
import { useNameStore } from '../stores/useNameStore'
import { useLocalStorage } from '../composables/useLocalStorage'
import { useClickOutside } from '../composables/useClickOutside'
import { COLOR_CLASSES } from '../constants/colors'
import { RARITY_COLORS } from '../constants'
import { formatNumber } from '../utils/formatters'

const jsonStore = useGlobalStore().jsonStore
const nameStore = useNameStore()

const t = (key) => nameStore.names?.divers?.[key] || key

// Filters with localStorage persistence
const searchName = useLocalStorage('wakfarm_prices_searchName', '')
const filterRarities = useLocalStorage('wakfarm_prices_rarities', [0, 1, 2, 3, 4, 5, 6, 7], { deep: true })
const filterLevelMin = useLocalStorage('wakfarm_prices_levelMin', '')
const filterLevelMax = useLocalStorage('wakfarm_prices_levelMax', '')
const sortColumn = useLocalStorage('wakfarm_prices_sortColumn', 'name')
const sortDirection = useLocalStorage('wakfarm_prices_sortDirection', 'asc')
const currentPage = useLocalStorage('wakfarm_prices_page', 1)
const itemsPerPage = useLocalStorage('wakfarm_prices_perPage', 50)

// Search autocomplete
const showAutocomplete = ref(false)
const { elementRef: searchDropdownRef } = useClickOutside(() => {
  showAutocomplete.value = false
})

// Rarity dropdown
const isRarityDropdownOpen = ref(false)
const { elementRef: rarityDropdownRef } = useClickOutside(() => {
  isRarityDropdownOpen.value = false
})

// Get all instances for the filter
const allInstancesList = computed(() => {
  const instances = jsonStore._rawInstances || []
  return instances.map(inst => ({
    id: inst.id,
    name: nameStore.names?.instances?.[inst.id] || `Instance #${inst.id}`
  })).sort((a, b) => a.name.localeCompare(b.name))
})

// Instances filter with special initialization logic
const savedInstancesRaw = (() => {
  try {
    const saved = localStorage.getItem('wakfarm_prices_instances')
    return saved !== null ? JSON.parse(saved) : null
  } catch {
    return null
  }
})()

const filterInstances = useLocalStorage(
  'wakfarm_prices_instances',
  savedInstancesRaw !== null ? savedInstancesRaw : [],
  { deep: true }
)

// Initialize with all instances if never saved
watch(allInstancesList, (newList) => {
  if (savedInstancesRaw === null && newList.length > 0 && filterInstances.value.length === 0) {
    filterInstances.value = newList.map(i => i.id)
  }
}, { immediate: true })

// Instances dropdown
const isInstancesDropdownOpen = ref(false)
const { elementRef: instancesDropdownRef } = useClickOutside(() => {
  isInstancesDropdownOpen.value = false
})

// Get all items with names, prices, and instances (using store getters)
const allItems = computed(() => {
  const items = jsonStore._rawItems || []
  const priceMap = jsonStore.priceMap
  const itemInstances = jsonStore.itemToInstancesMap
  
  return items.map(item => {
    const instanceIds = itemInstances[item.id] || []
    const instanceNames = instanceIds
      .map(id => nameStore.names?.instances?.[id] || `#${id}`)
      .sort((a, b) => a.localeCompare(b))
    
    return {
      id: item.id,
      name: nameStore.names?.items?.[item.id] || `Item #${item.id}`,
      rarity: item.rarity || 0,
      level: item.level || 0,
      price: priceMap[item.id] || null,
      instanceIds: instanceIds,
      instances: instanceNames
    }
  })
})

// Autocomplete suggestions
const autocompleteItems = computed(() => {
  if (!searchName.value || searchName.value.length < 2) return []
  
  const search = searchName.value.toLowerCase()
  return allItems.value
    .filter(item => item.name.toLowerCase().includes(search))
    .slice(0, 10) // Limit to 10 suggestions
})

// Filter and sort items
const filteredAndSortedItems = computed(() => {
  let result = [...allItems.value]
  
  // Filter by name
  if (searchName.value) {
    const search = searchName.value.toLowerCase()
    result = result.filter(item => item.name.toLowerCase().includes(search))
  }
  
  // Filter by rarity
  if (filterRarities.value.length === 0) {
    result = [] // None selected = hide all
  } else if (filterRarities.value.length < 8) {
    result = result.filter(item => filterRarities.value.includes(item.rarity))
  }
  // All selected = show all (no filter)
  
  // Filter by level
  if (filterLevelMin.value !== '' && filterLevelMin.value != null) {
    result = result.filter(item => item.level >= filterLevelMin.value)
  }
  if (filterLevelMax.value !== '' && filterLevelMax.value != null) {
    result = result.filter(item => item.level <= filterLevelMax.value)
  }
  
  // Filter by instances
  if (filterInstances.value.length === 0) {
    result = [] // None selected = hide all
  } else if (filterInstances.value.length < allInstancesList.value.length) {
    result = result.filter(item => {
      // Item must be found in at least one selected instance
      return item.instanceIds.some(instId => filterInstances.value.includes(instId))
    })
  }
  // All selected = show all (no filter)
  
  // Sort
  result.sort((a, b) => {
    let aVal = a[sortColumn.value]
    let bVal = b[sortColumn.value]
    
    // Handle instances sorting by count
    if (sortColumn.value === 'instances') {
      aVal = a.instanceIds?.length || 0
      bVal = b.instanceIds?.length || 0
    }
    // Handle null prices
    else if (sortColumn.value === 'price') {
      aVal = aVal ?? -1
      bVal = bVal ?? -1
    }
    // Handle string comparison
    else if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase()
      bVal = bVal.toLowerCase()
    }
    
    if (aVal < bVal) return sortDirection.value === 'asc' ? -1 : 1
    if (aVal > bVal) return sortDirection.value === 'asc' ? 1 : -1
    return 0
  })
  
  return result
})

// Pagination computed properties
const totalPages = computed(() => {
  return Math.ceil(filteredAndSortedItems.value.length / itemsPerPage.value)
})

const paginatedItems = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredAndSortedItems.value.slice(start, end)
})

const startItem = computed(() => {
  if (filteredAndSortedItems.value.length === 0) return 0
  return (currentPage.value - 1) * itemsPerPage.value + 1
})

const endItem = computed(() => {
  const end = currentPage.value * itemsPerPage.value
  return Math.min(end, filteredAndSortedItems.value.length)
})

// Reset to page 1 when filters change
watch([searchName, filterRarities, filterLevelMin, filterLevelMax, filterInstances, itemsPerPage], () => {
  currentPage.value = 1
})

// Search helpers
function onSearchInput() {
  showAutocomplete.value = searchName.value.length >= 2
}

function selectItem(item) {
  searchName.value = item.name
  showAutocomplete.value = false
}

// Rarity filter helpers
function toggleRarity(rarity) {
  const index = filterRarities.value.indexOf(rarity)
  if (index === -1) {
    filterRarities.value.push(rarity)
  } else {
    filterRarities.value.splice(index, 1)
  }
}

function toggleAllRarities(selectAll) {
  filterRarities.value = selectAll ? [0, 1, 2, 3, 4, 5, 6, 7] : []
  isRarityDropdownOpen.value = false
}

function getRarityDisplayText() {
  const count = filterRarities.value.length
  if (count === 0) return t('level_ranges_none')
  if (count === 8) return t('level_ranges_all')
  return `${count.toString().padStart(2, ' ')}/8`
}

// Instance filter helpers
function toggleInstance(instanceId) {
  const index = filterInstances.value.indexOf(instanceId)
  if (index === -1) {
    filterInstances.value.push(instanceId)
  } else {
    filterInstances.value.splice(index, 1)
  }
}

function toggleAllInstances(selectAll) {
  filterInstances.value = selectAll ? allInstancesList.value.map(i => i.id) : []
  isInstancesDropdownOpen.value = false
}

function getInstancesDisplayText() {
  const count = filterInstances.value.length
  const total = allInstancesList.value.length
  if (count === 0) return t('level_ranges_none')
  if (count === total) return t('level_ranges_all')
  return `${count.toString().padStart(2, ' ')}/${total}`
}

// Level validation helpers
function validateLevelMin(event) {
  const value = event.target.value
  if (value === '') {
    filterLevelMin.value = ''
    return
  }
  const num = parseInt(value)
  if (!isNaN(num)) {
    if (num < 1) {
      filterLevelMin.value = 1
    } else if (num > 245) {
      filterLevelMin.value = 245
    } else {
      filterLevelMin.value = num
    }
  }
}

function validateLevelMax(event) {
  const value = event.target.value
  if (value === '') {
    filterLevelMax.value = ''
    return
  }
  const num = parseInt(value)
  if (!isNaN(num)) {
    if (num < 1) {
      filterLevelMax.value = 1
    } else if (num > 245) {
      filterLevelMax.value = 245
    } else {
      filterLevelMax.value = num
    }
  }
}

function sortBy(column) {
  if (sortColumn.value === column) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortColumn.value = column
    sortDirection.value = 'asc'
  }
}

function getRarityColor(rarity) {
  return RARITY_COLORS[rarity] || RARITY_COLORS[0]
}

function getRarityName(rarity) {
  const names = {
    0: t('rarity_common'),
    1: t('rarity_unusual'),
    2: t('rarity_rare'),
    3: t('rarity_mythical'),
    4: t('rarity_legendary'),
    5: t('rarity_relic'),
    6: t('rarity_souvenir'),
    7: t('rarity_epic')
  }
  return names[rarity] || t('rarity_common')
}
</script>
