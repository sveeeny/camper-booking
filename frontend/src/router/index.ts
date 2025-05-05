// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router';
import GuestBookingView from '../views/GuestBookingView.vue';
import HostDashboard from '../views/HostDashboard.vue';
import CancelBookingView from '../views/CancelBookingView.vue';

const routes = [
  { path: '/', component: GuestBookingView },
  { path: '/stornieren', component: CancelBookingView },
  {
    path: '/host',
    component: () => import('@/views/HostDashboard.vue'),
    children: [
      {
        path: '',
        name: 'HostBookingList',
        component: () => import('@/components/Host/HostBookingList.vue'),
      },
      {
        path: 'buchung-hinzufuegen',
        name: 'HostBookingForm',
        component: () => import('@/components/Host/HostBookingForm.vue'),
      },
      {
        path: 'wochenansicht',
        name: 'HostBookingWeekView',
        component: () => import('@/components/Host/HostBookingWeekView.vue'),
      },
    ],
  },
  
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
