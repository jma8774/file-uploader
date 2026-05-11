<script setup lang="ts">
</script>

<template>
  <section class="not-found">
    <article class="card">
      <h1>Not found</h1>
      <p class="meta">The page you were looking for doesn't exist.</p>
      <RouterLink to="/" class="primary-button">Back to home</RouterLink>
    </article>
  </section>
</template>

<style scoped>
.not-found {
  margin-top: 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.card {
  width: 100%;
  max-width: 620px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  padding: 32px 24px;
  border-radius: var(--radius-lg);
  background: linear-gradient(180deg, rgba(22, 34, 53, 0.96), rgba(17, 28, 46, 0.96));
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-card);
  text-align: center;
}

.meta {
  color: var(--color-text-muted);
}

.primary-button {
  margin-top: 18px;
  min-height: 48px;
  padding: 0 22px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--color-primary), #2563eb);
  color: white;
  font-weight: 700;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
}
</style>
