<script setup lang="ts">
</script>

<template>
  <main class="app">
    <header class="app-header">
      <h1>Temporary File Drop</h1>
      <p>Upload a file and get a temporary download link.</p>
      <p>Files expire after 24 hours.</p>
    </header>
  </main>
</template>

<style scoped>
.app {
  max-width: 640px;
  margin: 0 auto;
  padding: 32px 20px;
}

.app-header {
  text-align: center;
}

.app-header h1 {
  margin: 0 0 8px;
}

.app-header p {
  margin: 0;
}
</style>
