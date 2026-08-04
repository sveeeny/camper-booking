// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router';
import { useUserStore } from '@/store/userStore';

// 🚪 Guest-Bereich
import GuestView from '@/views/Guest/GuestView.vue';
import StornoView from '@/views/Guest/StornoView.vue';

// 🧑‍💼 Host-Bereich
import HostLoginView from '@/views/Host/HostLoginView.vue';
import HostDashboardView from '@/views/Host/HostDashboardView.vue';

const routes = [
  {
    path: '/',
    name: 'GuestBooking',
    component: GuestView,
  },
  {
    path: '/success',
    name: 'BookingSuccess',
    component: () => import('@/components/User/Success.vue'),
  },
  {
    path: '/payment-cancelled',
    name: 'PaymentCancelled',
    component: GuestView,
  },
  {
    path: '/stornieren',
    name: 'StornoView',
    component: StornoView,
  },
  {
    path: '/login',
    name: 'HostLoginView',
    component: HostLoginView,
  },
  {
    path: '/host',
    component: HostDashboardView,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: { name: 'HostListView' }, // ⬅️ Automatische Weiterleitung zur Tagesansicht
      },
      {
        path: 'tagesansicht',
        name: 'HostListView',
        component: () => import('@/views/Host/HostListView.vue'),
      },
      {
        path: 'wochenansicht',
        name: 'HostWeekView',
        component: () => import('@/views/Host/HostWeekView.vue'),
      },
      {
        path: 'buchung-hinzufuegen',
        name: 'HostAddBookingView',
        component: () => import('@/views/Host/HostAddBookingView.vue'),
      },
      {
        path: 'settings',
        name: 'AdminSettingsView',
        component: () => import('@/views/Admin/AdminSettingsView.vue'),
        meta: {
          requiresAuth: true,
          requiresAdmin: true, // 👈 falls du so ein Flag nutzt
        }
      },
      {
        path: 'users',
        name: 'AdminUsersView',
        component: () => import('@/views/Admin/AdminUsersView.vue'),
        meta: {
          requiresAuth: true,
          requiresAdmin: true,
        },
      }
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 🛡️ Zugriffsschutz
router.beforeEach((to, _, next) => {
  const userStore = useUserStore();

  // ⛔ Eingeloggt und auf Login → Weiterleiten
  if (to.path === '/login' && userStore.isLoggedIn) {
    return next('/host');
  }

  // 🔐 Nur eingeloggte Hosts dürfen Host-Routen sehen
  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    return next('/login');
  }
  // ⛔ Host auf Startseite? → Weiterleiten zum Host-Dashboard
  if (to.path === '/' && userStore.isLoggedIn) {
    return next('/host');
  }

  if (to.meta.requiresAdmin && userStore.role !== 'admin') {
    next({ name: 'HostListView' });
    return;
  }

  next();
});

export default router;
