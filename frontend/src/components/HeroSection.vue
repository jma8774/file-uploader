<script setup lang="ts">
import { Sparkles } from 'lucide-vue-next'
</script>

<template>
  <section class="hero">
    <span class="hero-badge">
      <Sparkles :size="14" :stroke-width="2.4" />
      Fast. Secure. Temporary.
    </span>
    <h1 class="hero-title">
      Upload a file.<br />
      Get a <span class="hero-accent">temporary link.</span>
    </h1>
    <p class="hero-subtitle">
      Share files instantly. All files are automatically deleted after 24 hours.
    </p>
  </section>
</template>

<style scoped>
.hero {
  text-align: center;
  padding: 58px 0 0;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.4rem 0.7rem;
  border-radius: var(--radius-pill);
  background: var(--color-accent-soft);
  border: 1px solid rgba(20, 184, 166, 0.28);
  color: #5eead4;
  font-size: 0.875rem;
  font-weight: 600;
}

.hero-title {
  margin: 20px auto 0;
  max-width: 760px;
  font-size: clamp(2.4rem, 6vw, 4.5rem);
  line-height: 0.98;
  font-weight: 800;
  letter-spacing: -0.055em;
  color: var(--color-text);
}

.hero-accent {
  color: var(--color-primary);
}

.hero-subtitle {
  margin: 18px auto 0;
  max-width: 520px;
  color: var(--color-text-muted);
  font-size: 1.125rem;
  line-height: 1.55;
}

@media (max-width: 720px) {
  .hero {
    padding-top: 32px;
  }
  .hero-title {
    font-size: clamp(2rem, 12vw, 3rem);
    line-height: 1.02;
  }
  .hero-subtitle {
    font-size: 1rem;
  }
}
</style>
