<script setup lang="ts">
defineProps<{ token: string }>()
</script>

<template>
  <section class="download">
    <h1>Download</h1>
    <p>Token: <code>{{ token }}</code></p>
    <!-- TODO: file info + Download button (TICKET-009) -->
  </section>
</template>
