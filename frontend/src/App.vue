<script setup lang="ts">
</script>

<template>
  <main class="app">
    <RouterView />
  </main>
</template>

<style scoped>
.app {
  max-width: 640px;
  margin: 0 auto;
  padding: var(--space-4) 20px;
}

@media (max-width: 480px) {
  .app {
    padding: 20px 16px;
  }
}
</style>
