import { defineStore } from 'pinia';

export const useUserStore = defineStore('user', {
  state: () => ({
    token: '',
    role: '',
  }),
  getters: {
    isHost: (state) => state.role === 'host',
    isLoggedIn: (state) => !!state.token,
  },
});
