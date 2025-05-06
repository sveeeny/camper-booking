import { defineStore } from 'pinia';

interface JwtPayload {
  email: string;
  sub: number;
  role: 'admin' | 'host';
  iat?: number;
  exp?: number;
}

function decodeJWT(token: string): JwtPayload | null {
  try {
    const payload = token.split('.')[1];
    const decoded = atob(payload);
    return JSON.parse(decoded);
  } catch (err) {
    console.error('❌ Fehler beim Dekodieren des JWT:', err);
    return null;
  }
}

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return Date.now() >= payload.exp * 1000;
  } catch (err) {
    return true;
  }
}

export const useUserStore = defineStore('user', {
  state: () => ({
    token: '',
    email: '',
    role: '' as 'host' | 'admin' | '',
  }),

  getters: {
    isHost: (state) => state.role === 'host',
    isAdmin: (state) => state.role === 'admin',
    isLoggedIn: (state) => !!state.token,
  },

  actions: {
    login(token: string, rememberMe: boolean) {
      this.token = token;

      // Speichern je nach "remember me"
      if (rememberMe) {
        localStorage.setItem('token', token);
      } else {
        sessionStorage.setItem('token', token);
      }

      const payload = decodeJWT(token);
      if (payload) {
        this.email = payload.email;
        this.role = payload.role;
      }
    },

    logout() {
      this.token = '';
      this.email = '';
      this.role = '';
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
    },

    initializeFromStorage() {
      const storedToken =
        localStorage.getItem('token') || sessionStorage.getItem('token');

      if (storedToken && !isTokenExpired(storedToken)) {
        this.token = storedToken;
        const payload = decodeJWT(storedToken);
        if (payload) {
          this.email = payload.email;
          this.role = payload.role;
        }
      } else {
        this.logout(); // 🧼 sicherheitshalber aufräumen
      }
    },
  },
});
