import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { useGlobalStore } from './useGlobalStore'

const STORAGE_KEY = 'wakfarm_runs'
const STORAGE_KEY_EXPANDED = 'wakfarm_runs_expanded'

export const useRunsStore = defineStore('runs', () => {
  // Structure: { instanceId: [{ id, isModulated, isBooster, stasis, steles, steleIntervention, time }] }
  const loadRuns = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : {}
    } catch {
      return {}
    }
  }

  const loadExpandedInstances = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_EXPANDED)
      return saved ? new Set(JSON.parse(saved)) : new Set()
    } catch {
      return new Set()
    }
  }

  const runs = ref(loadRuns())
  const expandedInstances = ref(loadExpandedInstances())

  // Save to localStorage on change
  watch(
    runs,
    (newVal) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newVal))
      } catch (e) {
        console.error('Erreur sauvegarde runs:', e)
      }
    },
    { deep: true }
  )

  // Save expanded state to localStorage
  watch(
    expandedInstances,
    (newVal) => {
      try {
        localStorage.setItem(STORAGE_KEY_EXPANDED, JSON.stringify([...newVal]))
      } catch (e) {
        console.error('Erreur sauvegarde expanded instances:', e)
      }
    },
    { deep: true }
  )

  // Add a new run to an instance
  function addRun(instanceId, instance = null) {
    const globalStore = useGlobalStore()
    const config = globalStore.config

    // Check if this is a rift (brèche)
    const isRift = instance && !instance.isDungeon

    const newRun = {
      id: Date.now(), // Unique ID
      time: 10 // Temps en minutes (10 par défaut)
    }

    if (isRift) {
      // Rift-specific config
      newRun.isRift = true
      newRun.isUltimate = instance.isUltimate || false // Ultimate rifts have different bonuses
      newRun.startingWave = 1 // Vague de départ (min 1)
      // Ultimate rifts: 4 waves default (legendary threshold), normal rifts: 9 waves
      newRun.wavesCompleted = instance.isUltimate ? 4 : 9
      newRun.isBooster = config.isBooster // Rifts can also use booster
    } else {
      // Dungeon config
      newRun.isRift = false
      newRun.isModulated = config.isModulated
      newRun.isBooster = config.isBooster
      newRun.stasis = config.stasis
      newRun.steles = config.steles
      newRun.steleIntervention = config.steleIntervention
      newRun.intervention = config.intervention || false
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
