// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router';
import GuestBookingView from '../views/GuestBookingView.vue';
import HostDashboard from '../views/HostDashboard.vue';
import CancelBookingView from '../views/CancelBookingView.vue';

const routes = [
  { path: '/', component: GuestBookingView },
  { path: '/stornieren', component: CancelBookingView },
  { path: '/host', component: HostDashboard, meta: { requiresHost: true } },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
