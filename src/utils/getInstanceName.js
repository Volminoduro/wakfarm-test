import { useNameStore } from '@/stores/useNameStore'

export function getInstanceName(instanceId) {
  return useNameStore().names?.instances?.[instanceId] || `Instance #${instanceId}`
}