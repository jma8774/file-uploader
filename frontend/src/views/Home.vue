<script setup lang="ts">
</script>

<template>
  <section class="home">
    <header class="home-header">
      <h1>Temporary File Drop</h1>
      <p>Upload a file and get a temporary download link.</p>
      <p>Files expire after 24 hours.</p>
    </header>
    <!-- TODO: FileUploader (TICKET-005) -->
    <!-- TODO: UploadResult (TICKET-007) -->
    <!-- TODO: StatsPanel (TICKET-008) -->
  </section>
</template>

<style scoped>
.home-header {
  text-align: center;
}

.home-header h1 {
  margin: 0 0 8px;
}

.home-header p {
  margin: 0;
}
</style>
