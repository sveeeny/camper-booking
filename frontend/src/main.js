import './style.css';
import { createApp } from 'vue';
import App from './App.vue';

import { createPinia } from 'pinia';
import router from './router';

import './styles/multiselect.css';

import { useUserStore } from '@/store/userStore'; // 🔑 Importiere den Store
import {i18n} from './i18n';


const app = createApp(App);

const pinia = createPinia();
app.use(pinia);
app.use(router);

// ✅ Auth-Zustand laden (Token, Rolle etc.)
const userStore = useUserStore();
userStore.initializeFromStorage();

app.mount('#app');
