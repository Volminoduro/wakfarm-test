import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { useAppStore } from './useAppStore'
import { useLocalStorage } from '@/composables/useLocalStorage'

const STORAGE_KEY = 'wakfarm_runs'
const STORAGE_KEY_EXPANDED = 'wakfarm_runs_expanded'

export const useRunStore = defineStore('runs', () => {
  // Structure: { instanceId: [{ id, isModulated, isBooster, stasis, steles, steleIntervention, time }] }
  // Persist runs as an object
  const runs = useLocalStorage(STORAGE_KEY, {}, { deep: true })

  // Persist expanded instances as an array but expose a Set for compatibility
  const _expandedArray = useLocalStorage(STORAGE_KEY_EXPANDED, [], { deep: true })
  const expandedInstances = ref(new Set(_expandedArray.value))

  // Sync storage array -> Set (e.g. cross-tab updates)
  watch(
    _expandedArray,
    (newVal) => {
      try {
        const arr = newVal || []
        // avoid unnecessary reassignments which can trigger recursive watchers
        const current = [...expandedInstances.value]
        const equal = arr.length === current.length && arr.every((v, i) => v === current[i])
        if (!equal) expandedInstances.value = new Set(arr)
      } catch (e) {
        expandedInstances.value = new Set()
      }
    },
    { deep: true }
  )

  // Sync Set -> storage array
  watch(
    expandedInstances,
    (newVal) => {
      try {
        const arr = [...newVal]
        const current = _expandedArray.value || []
        const equal = arr.length === current.length && arr.every((v, i) => v === current[i])
        if (!equal) _expandedArray.value = arr
      } catch (e) {
        _expandedArray.value = []
      }
    },
    { deep: true }
  )

  // Add a new run to an instance
  function addRun(instanceId, instance = null) {
    const appStore = useAppStore()
    const config = appStore.config

    const isRift = instance && !instance.isDungeon

    const newRun = {
      id: Date.now(), // Unique ID
      time: 10 // Temps en minutes
    }

    if (isRift) {
      newRun.isRift = true
      newRun.isUltimate = instance.isUltimate || false
      newRun.startingWave = 1
      newRun.wavesCompleted = instance.isUltimate ? 4 : 9
      newRun.isBooster = config.isBooster
    } else {
      // Dungeon config
      newRun.isRift = false
      newRun.isModulated = config.isModulated
      newRun.isBooster = config.isBooster
      newRun.stasis = config.stasis
      newRun.steles = config.steles
      newRun.steleIntervention = config.steleIntervention
    }

    if (!runs.value[instanceId]) {
      runs.value[instanceId] = []
    }

    runs.value[instanceId].push(newRun)
  }

  // Remove a specific run
  function removeRun(instanceId, runId) {
    if (!runs.value[instanceId]) return

    const index = runs.value[instanceId].findIndex(r => r.id === runId)
    if (index !== -1) {
      runs.value[instanceId].splice(index, 1)

      // Clean up if no runs left
      if (runs.value[instanceId].length === 0) {
        delete runs.value[instanceId]
        // Réduire l'instance quand on supprime le dernier run
        expandedInstances.value.delete(instanceId)
        // trigger sync watcher by reassigning a new Set
        expandedInstances.value = new Set(expandedInstances.value)
      }
    }
  }

  // Remove all runs for an instance
  function removeAllRunsForInstance(instanceId) {
    delete runs.value[instanceId]
    // Réduire l'instance quand on supprime tous ses runs
    expandedInstances.value.delete(instanceId)
    expandedInstances.value = new Set(expandedInstances.value)
  }

  // Remove all runs from all instances
  function removeAllRuns() {
    runs.value = {}
    // Réduire toutes les instances
    expandedInstances.value = new Set()
  }

  // Update a specific run
  function updateRun(instanceId, runId, updates) {
    if (!runs.value[instanceId]) return

    const run = runs.value[instanceId].find(r => r.id === runId)
    if (run) {
      Object.assign(run, updates)
    }
  }

  // Get runs for an instance
  function getRunsForInstance(instanceId) {
    return runs.value[instanceId] || []
  }

  // Toggle instance expansion
  function toggleExpanded(instanceId) {
    if (expandedInstances.value.has(instanceId)) {
      expandedInstances.value.delete(instanceId)
    } else {
      expandedInstances.value.add(instanceId)
    }
    // Reassign to trigger watchers
    expandedInstances.value = new Set(expandedInstances.value)
  }

  // Expand all instances
  function expandAll(instanceIds) {
    expandedInstances.value = new Set(instanceIds)
  }

  // Collapse all instances
  function collapseAll() {
    expandedInstances.value = new Set()
  }

  // Export runs configuration to clipboard
  async function exportRuns() {
    const data = {
      version: 1,
      exportDate: new Date().toISOString(),
      runs: runs.value
    }
    const json = JSON.stringify(data, null, 2)
    
    try {
      await navigator.clipboard.writeText(json)
      return { success: true, message: 'Configuration copiée dans le presse-papier !' }
    } catch (error) {
      return { success: false, message: 'Erreur lors de la copie: ' + error.message }
    }
  }

  // Import runs configuration from clipboard
  async function importRuns() {
    try {
      const text = await navigator.clipboard.readText()
      const data = JSON.parse(text)
      
      if (data.runs && typeof data.runs === 'object') {
        runs.value = data.runs
        return { success: true, count: Object.keys(data.runs).length }
      } else {
        throw new Error('Format invalide')
      }
    } catch (error) {
      throw new Error('Erreur lors de l\'import: ' + error.message)
    }
  }

  return {
    runs,
    expandedInstances,
    addRun,
    removeRun,
    removeAllRunsForInstance,
    removeAllRuns,
    updateRun,
    getRunsForInstance,
    toggleExpanded,
    expandAll,
    collapseAll,
    exportRuns,
    importRuns
  }
})
