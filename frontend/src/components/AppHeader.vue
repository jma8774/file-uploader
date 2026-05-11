<script setup lang="ts">
import { CloudUpload, Moon } from 'lucide-vue-next'
</script>

<template>
  <header class="header page-shell">
    <RouterLink to="/" class="logo">
      <span class="logo-icon">
        <CloudUpload :size="20" :stroke-width="2.2" />
      </span>
      FileDrop
    </RouterLink>

    <nav class="nav-links" aria-label="Primary">
      <a href="#" class="is-active">Home</a>
      <a href="#">How it Works</a>
      <a href="#">Features</a>
      <a href="#">Pricing</a>
      <a href="#">FAQ</a>
    </nav>

    <div class="right-cluster">
      <button type="button" class="icon-button" aria-label="Toggle theme">
        <Moon :size="18" :stroke-width="2" />
      </button>
      <a href="#" class="login-link">Log in</a>
      <a href="#" class="signup-button">Sign up</a>
    </div>
  </header>
</template>

<style scoped>
.header {
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--color-border);
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 800;
  font-size: 1.35rem;
  color: var(--color-text);
  text-decoration: none;
}

.logo-icon {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-sm);
  background: var(--color-primary-soft);
  color: var(--color-primary);
  display: grid;
  place-items: center;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.nav-links a {
  color: inherit;
  text-decoration: none;
  transition: color 120ms ease;
}

.nav-links a:hover,
.nav-links .is-active {
  color: var(--color-text);
}

.right-cluster {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.icon-button {
  width: 38px;
  height: 38px;
  border-radius: var(--radius-pill);
  border: 1px solid var(--color-border);
  background: transparent;
  color: var(--color-text-muted);
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: color 120ms ease, border-color 120ms ease;
}

.icon-button:hover {
  color: var(--color-text);
  border-color: var(--color-border-strong);
}

.login-link {
  color: var(--color-text-muted);
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  transition: color 120ms ease;
}

.login-link:hover {
  color: var(--color-text);
}

.signup-button {
  padding: 0.45rem 1rem;
  border-radius: 10px;
  background: var(--color-accent);
  color: white;
  text-decoration: none;
  font-weight: 700;
  font-size: 0.9rem;
  transition: background-color 120ms ease;
}

.signup-button:hover {
  background: var(--color-accent-hover);
}

@media (max-width: 720px) {
  .header {
    height: 64px;
  }
  .nav-links {
    display: none;
  }
  .login-link {
    display: none;
  }
}
</style>
