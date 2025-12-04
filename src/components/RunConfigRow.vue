<script setup>
import { COLOR_CLASSES } from '../constants/colors'
import { useDataStore } from '../stores/useDataStore'

const props = defineProps({
  run: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update', 'remove'])

const dataStore = useDataStore()
const t = (key) => dataStore.names?.divers?.[key] || key

function updateField(field, value) {
  emit('update', { ...props.run, [field]: value })
}
</script>

<template>
  <!-- Rift (Brèche) Configuration -->
  <div v-if="run.isRift" :class="['px-4 py-3 border-t border-[#363634] flex items-center gap-2', COLOR_CLASSES.bgSecondary]">
    <div class="flex items-center gap-2 flex-1">
      <!-- Vague de départ -->
      <div class="flex justify-center" style="width: 120px;">
        <input 
          type="number"
          :value="run.startingWave"
          @input="updateField('startingWave', Math.max(1, parseInt($event.target.value) || 1))"
          :class="[COLOR_CLASSES.input, 'text-sm py-1 text-center']"
          style="width: 60px;"
          min="1"
        />
      </div>

      <!-- Nombre de vagues effectuées -->
      <div class="flex justify-center" style="width: 120px;">
        <input 
          type="number"
          :value="run.wavesCompleted"
          @input="updateField('wavesCompleted', Math.min(99, Math.max(1, parseInt($event.target.value) || 1)))"
          :class="[COLOR_CLASSES.input, 'text-sm py-1 text-center']"
          style="width: 60px;"
          min="1"
          max="99"
        />
      </div>

      <!-- Empty spacers to align with dungeon layout (Modulé, Booster, Stasis, Stèles, Stèles Interv.) -->
      <div style="width: 95px;"></div>

      <!-- Temps (minutes) -->
      <div class="flex justify-center" style="width: 60px;">
        <input 
          type="number"
          :value="run.time"
          @input="updateField('time', $event.target.value ? Math.max(1, parseInt($event.target.value)) : null)"
          :placeholder="'min'"
          :class="[COLOR_CLASSES.input, 'text-sm py-1 text-center']"
          style="width: 50px;"
          min="1"
        />
      </div>
    </div>

    <!-- Bouton supprimer -->
    <div class="flex justify-center" style="width: 60px;">
      <button 
        @click="emit('remove')"
        :class="['px-2 py-1 rounded text-sm transition-colors', 'bg-red-900/50 hover:bg-red-800 text-red-200']"
        :title="t('button_remove') || 'Supprimer'">
        ✕
      </button>
    </div>
  </div>

  <!-- Dungeon Configuration -->
  <div v-else :class="['px-4 py-3 border-t border-[#363634] flex items-center gap-2', COLOR_CLASSES.bgSecondary]">
    <div class="flex items-center gap-2 flex-1">
      <!-- Modulé -->
      <div class="flex justify-center" style="width: 60px;">
        <input 
          type="checkbox" 
          :checked="run.isModulated"
          @change="updateField('isModulated', $event.target.checked)"
          class="custom-checkbox-small"
        />
      </div>

      <!-- Booster -->
      <div class="flex justify-center" style="width: 60px;">
        <input 
          type="checkbox" 
          :checked="run.isBooster"
          @change="updateField('isBooster', $event.target.checked)"
          class="custom-checkbox-small"
        />
      </div>

      <!-- Stasis -->
      <div class="flex justify-center" style="width: 60px;">
        <select 
          :value="run.stasis"
          @change="updateField('stasis', parseInt($event.target.value))"
          :class="[COLOR_CLASSES.selectRunCard, 'text-sm py-1']"
          style="width: 50px;">
          <option v-for="n in 10" :key="n" :value="n">{{ n }}</option>
        </select>
      </div>

      <!-- Stèles -->
      <div class="flex justify-center" style="width: 60px;">
        <select 
          :value="run.steles"
          @change="updateField('steles', parseInt($event.target.value))"
          :class="[COLOR_CLASSES.selectRunCard, 'text-sm py-1']"
          style="width: 50px;">
          <option v-for="n in 5" :key="n - 1" :value="n - 1">{{ n - 1 }}</option>
        </select>
      </div>

      <!-- Stèles Interv. -->
      <div class="flex justify-center" style="width: 80px;">
        <select 
          :value="run.steleIntervention"
          @change="updateField('steleIntervention', parseInt($event.target.value))"
          :class="[COLOR_CLASSES.selectRunCard, 'text-sm py-1']"
          style="width: 50px;">
          <option v-for="n in 4" :key="n - 1" :value="n - 1">{{ n - 1 }}</option>
        </select>
      </div>

      <!-- Temps (minutes) -->
      <div class="flex justify-center" style="width: 60px;">
        <input 
          type="number"
          :value="run.time"
          @input="updateField('time', $event.target.value ? Math.max(1, parseInt($event.target.value)) : null)"
          :placeholder="t('config_time_placeholder') || 'min'"
          :class="[COLOR_CLASSES.input, 'text-sm py-1 text-center']"
          style="width: 50px;"
          min="1"
        />
      </div>
    </div>

    <!-- Bouton supprimer -->
    <div class="flex justify-center" style="width: 60px;">
      <button 
        @click="emit('remove')"
        :class="['px-2 py-1 rounded text-sm transition-colors', 'bg-red-900/50 hover:bg-red-800 text-red-200']"
        :title="t('button_remove') || 'Supprimer'">
        ✕
      </button>
    </div>
  </div>
</template>

<style scoped>
.custom-checkbox-small {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  width: 18px;
  height: 18px;
  border: 2px solid rgba(211, 253, 56, 0.4);
  border-radius: 3px;
  background-color: #334155;
  cursor: pointer;
  position: relative;
  transition: all 0.15s ease;
}

.custom-checkbox-small:hover {
  border-color: rgba(211, 253, 56, 0.6);
}

.custom-checkbox-small:checked {
  background-color: #d3fd38;
  border-color: #d3fd38;
}

.custom-checkbox-small:focus {
  outline: 2px solid #d3fd38;
  outline-offset: 2px;
  border-color: #d3fd38;
}

input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
input[type=number] {
  appearance: textfield;
  -moz-appearance: textfield;
}
</style>
