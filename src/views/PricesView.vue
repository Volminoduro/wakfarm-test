<template>
  <div class="px-8 py-6 max-w-[1920px] mx-auto">
    <div :class="[COLOR_CLASSES.bgSecondary, COLOR_CLASSES.borderCard, 'rounded-lg p-6 mb-4']">
      <h2 :class="['text-2xl font-bold mb-4', COLOR_CLASSES.textAccent]">Gestion des Prix</h2>
      <p :class="COLOR_CLASSES.textSecondary">Work in progress: Édition et gestion des prix personnalisés</p>
    </div>
    
    <div :class="[COLOR_CLASSES.bgSecondary, COLOR_CLASSES.borderCard, 'rounded-lg p-6']">
      <h3 :class="['text-xl mb-4', COLOR_CLASSES.textAccentLight]">Liste de prix de test</h3>
      <div class="space-y-2">
        <div :class="['flex justify-between items-center p-3 rounded', COLOR_CLASSES.bgTertiary]">
          <span :class="COLOR_CLASSES.textNormal">Item de test 1</span>
          <span :class="['font-bold', COLOR_CLASSES.textKamas]">1000 ₭</span>
        </div>
        <div :class="['flex justify-between items-center p-3 rounded', COLOR_CLASSES.bgTertiary]">
          <span :class="COLOR_CLASSES.textNormal">Item de test 2</span>
          <span :class="['font-bold', COLOR_CLASSES.textKamas]">5000 ₭</span>
        </div>
        <div :class="['flex justify-between items-center p-3 rounded', COLOR_CLASSES.bgTertiary]">
          <span :class="COLOR_CLASSES.textNormal">Item de test 3</span>
          <span :class="['font-bold', COLOR_CLASSES.textKamas]">10000 ₭</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { COLOR_CLASSES } from '../constants/colors'

// État pour la gestion des prix
const customPrices = ref({})
</script>
