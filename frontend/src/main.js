import './style.css';
import { createApp } from 'vue';
import App from './App.vue';

import { createPinia } from 'pinia';
import router from './router';

import './styles/multiselect.css';

import { useUserStore } from '@/store/userStore';
import {i18n} from './i18n';
import Toast from 'vue-toastification';
import 'vue-toastification/dist/index.css';



const app = createApp(App);

const pinia = createPinia();
app.use(pinia);
app.use(router);
app.use(Toast);


app.use(i18n);

// ✅ Auth-Zustand laden (Token, Rolle etc.)
const userStore = useUserStore();
userStore.initializeFromStorage();

app.mount('#app');
