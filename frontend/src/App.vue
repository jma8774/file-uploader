<script setup lang="ts">
import AppHeader from './components/AppHeader.vue'
</script>

<template>
  <AppHeader />
  <main class="app-main page-shell">
    <RouterView />
  </main>
</template>

<style scoped>
.app-main {
  padding-block: 0 48px;
}

@media (max-width: 720px) {
  .app-main {
    padding-block: 0 28px;
  }
}
</style>
