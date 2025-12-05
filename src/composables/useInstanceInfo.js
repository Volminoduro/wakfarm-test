import { computed } from 'vue'
import { useDataStore } from '../stores/useDataStore'

export function useInstanceInfo(instanceId) {
  const dataStore = useDataStore()
  const instance = computed(() => dataStore._rawInstances.find(i => i.id === instanceId))
  const bossId = computed(() => instance.value?.bossId || null)
  const name = computed(() => dataStore.names?.instances?.[instanceId] || `Instance #${instanceId}`)
  const level = computed(() => instance.value?.level || '?')
  return { instance, bossId, name, level }
}
