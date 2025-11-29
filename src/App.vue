<script setup>
import ConfigView from './views/ConfigView.vue';
import HomeView from './views/HomeView.vue'
import LanguageSelector from './components/LanguageSelector.vue'
</script>

<template>
  <div class="fixed top-0 left-0 right-0 bg-white shadow-md z-40 p-4 flex justify-between items-center">
    <h1 class="text-3xl font-bold">Wakfarm</h1>
    <LanguageSelector />
  </div>
  
  <div class="pt-20">
    <ConfigView />
    <HomeView />
  </div>
</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
