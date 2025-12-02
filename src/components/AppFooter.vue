<script setup>
import { COLOR_CLASSES } from '../constants/colors'
</script>

<template>
  <footer :class="[COLOR_CLASSES.footerBg, COLOR_CLASSES.footerBorder]">
    <div :class="['border-t-3 mb-1', COLOR_CLASSES.borderPrimary]"></div>
    <div class="px-8 py-3">
      <div :class="['flex justify-between items-center text-xs', COLOR_CLASSES.footerText]">
        <p>Wakfarm - Calculateur de rentabilité Wakfu</p>
        <p>Projet non officiel - Wakfu © Ankama Games</p>
      </div>
    </div>
  </footer>
</template>
