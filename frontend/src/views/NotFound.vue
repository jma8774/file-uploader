<script setup lang="ts">
</script>

<template>
  <section class="not-found">
    <h1>Not found</h1>
    <p>The page you were looking for doesn't exist.</p>
    <RouterLink to="/" class="home-link">Back to home</RouterLink>
  </section>
</template>

<style scoped>
.not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  text-align: center;
}

.home-link {
  margin-top: var(--space-3);
  min-height: var(--tap-target);
  padding: 10px 22px;
  border-radius: var(--radius-sm);
  background: var(--color-accent);
  color: var(--color-accent-contrast);
  text-decoration: none;
  display: inline-flex;
  align-items: center;
}
</style>
