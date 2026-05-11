<script setup lang="ts">
</script>

<template>
  <main class="app-main page-shell">
    <RouterView />
  </main>
</template>

<style scoped>
.app-main {
  padding-block: 32px 48px;
}

@media (max-width: 720px) {
  .app-main {
    padding-block: 20px 28px;
  }
}
</style>
