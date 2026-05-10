import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import Home from './views/Home.vue'
import Download from './views/Download.vue'
import NotFound from './views/NotFound.vue'

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: Home },
  { path: '/file/:token', name: 'download', component: Download, props: true },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFound },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})
