import { defineStore } from 'pinia';

export const useAuthUserStore = defineStore('auth/user', {
  state: () => ({
    token: null,
    permisos: null,
    pv_selected_admin: null
  }),
  persist: true,
  getters: {
    doubleCount: (state) => state.counter * 2,
  },
  actions: {
    setToken(token) {
      this.token = token;
    },
    setPermisos( permisos ) {
      this.permisos = permisos;
    },
    setPV( pv_id ) {
      this.pv_selected_admin = pv_id;
    }
  },
});
