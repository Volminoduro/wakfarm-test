<script setup>
import { COLOR_CLASSES } from '../../constants/colors'
import { useNameStore } from '../../stores/useNameStore'

const nameStore = useNameStore()

const t = (key) => nameStore.names?.divers?.[key] || key
</script>

<template>
  <footer :class="[COLOR_CLASSES.footerBg]">
    <div :class="['border-t-3 mb-1', COLOR_CLASSES.borderPrimary]"></div>
    <div class="px-8 py-3">
      <div :class="['flex justify-between items-center text-xs', COLOR_CLASSES.footerText]">
        <p>{{ t('footer_title') }}</p>
        <p>{{ t('footer_steles_update') }} xx.xx.xxxx</p>
        <p>{{ t('footer_disclaimer') }}</p>
      </div>
    </div>
  </footer>
</template>
