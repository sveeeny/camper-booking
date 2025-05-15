// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router';
import GuestBookingView from '../views/GuestBookingView.vue';
import HostDashboard from '../views/HostDashboard.vue';
import CancelBookingView from '../views/CancelBookingView.vue';
import { useUserStore } from '@/store/userStore';

const routes = [
  { path: '/', component: GuestBookingView },
  {
    path: '/success',
    name: 'BookingSuccess',
    component: () => import('@/views/BookingSuccessView.vue'),
  },
  {
    path: '/payment-cancelled',
    name: 'PaymentCancelled',
    component: () => import('@/views/GuestBookingView.vue'),
  },

  { path: '/stornieren', component: CancelBookingView },
  {
    path: '/host',
    component: () => import('@/views/HostDashboard.vue'),
    meta: { requiresAuth: true }, // 👈 wichtig
    children: [
      {
        path: '',
        name: 'HostBookingList',
        component: () => import('@/components/Host/HostBookingList.vue'),
      },
      {
        path: 'buchung-hinzufuegen',
        name: 'HostBookingForm',
        component: () => import('@/components/User/BookingForm.vue'),
      },
      {
        path: 'wochenansicht',
        name: 'HostBookingWeekView',
        component: () => import('@/components/Host/HostBookingWeekView.vue'),
      },
      {
        path: '/host/buchung/:id',
        name: 'HostBookingDetail',
        component: () => import('@/components/Host/HostBookingDetail.vue'),
      },

    ],
  },

  {
    path: '/login',
    name: 'HostLogin',
    component: () => import('@/views/HostLoginView.vue'),
  },


];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, _, next) => {
  const userStore = useUserStore();

  // ⛔ Wenn eingeloggt und auf Login-Seite → weiterleiten
  if (to.path === '/login' && userStore.isLoggedIn) {
    return next('/host');
  }

  // 🔒 Auth-geschützte Routen
  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    return next('/login');
  }

  next();
});


export default router;
