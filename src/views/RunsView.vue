<script setup>
import { ref } from 'vue'
import { COLOR_CLASSES } from '../constants/colors'

// État pour la gestion des runs
const runs = ref([])
</script>

<template>
  <div class="px-8 py-6 max-w-[1920px] mx-auto">
    <div :class="[COLOR_CLASSES.bgSecondary, COLOR_CLASSES.borderCard, 'rounded-lg p-6 mb-4']">
      <h2 :class="['text-2xl font-bold mb-4', COLOR_CLASSES.textAccent]">Gestion des Runs</h2>
      <p :class="COLOR_CLASSES.textSecondary">Work in progress: Suivi et historique des runs</p>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div :class="[COLOR_CLASSES.bgSecondary, COLOR_CLASSES.borderCard, 'rounded-lg p-4']">
        <h3 :class="['text-xl mb-2', COLOR_CLASSES.textAccentLight]">Carte de test 1</h3>
        <p :class="COLOR_CLASSES.textSecondary">Ceci est du contenu de test pour vérifier l'affichage</p>
      </div>
      <div :class="[COLOR_CLASSES.bgSecondary, COLOR_CLASSES.borderCard, 'rounded-lg p-4']">
        <h3 :class="['text-xl mb-2', COLOR_CLASSES.textAccentLight]">Carte de test 2</h3>
        <p :class="COLOR_CLASSES.textSecondary">Ceci est du contenu de test pour vérifier l'affichage</p>
      </div>
      <div :class="[COLOR_CLASSES.bgSecondary, COLOR_CLASSES.borderCard, 'rounded-lg p-4']">
        <h3 :class="['text-xl mb-2', COLOR_CLASSES.textAccentLight]">Carte de test 3</h3>
        <p :class="COLOR_CLASSES.textSecondary">Ceci est du contenu de test pour vérifier l'affichage</p>
      </div>
    </div>
  </div>
</template>
