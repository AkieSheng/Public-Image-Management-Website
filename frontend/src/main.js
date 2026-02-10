import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import { setToken as setImgToken } from './services/images';
import { setToken as setTagToken } from './services/tags';

const t = localStorage.getItem('token');
const u = localStorage.getItem('user');
if (t) {
  setImgToken(t);
  setTagToken(t);
  // 恢复到 store
  try { store.commit('setAuth', { token: t, user: u ? JSON.parse(u) : null }); } catch {}
}

createApp(App).use(router).use(store).mount('#app');
