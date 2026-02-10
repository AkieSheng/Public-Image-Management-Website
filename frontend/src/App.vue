<template>
  <div>
    <header class="container" style="padding-top:18px">
      <div class="panel" style="display:flex;align-items:center;justify-content:space-between;gap:12px">
        <div style="display:flex;align-items:center;gap:12px">
          <!-- SVG 相机图标 -->
          <svg width="24" height="24" viewBox="0 0 24 24" style="border-radius:6px;color:#6aa7ff">
            <path fill="currentColor" d="M4 7a3 3 0 0 1 3-3h2l1-1h4l1 1h2a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V7z"/>
            <circle cx="12" cy="13" r="4.2" fill="#9ec0ff"/>
          </svg>
          <strong>图片管理网站</strong>
        </div>
        <nav class="row">
          <RouterLink class="badge" to="/gallery">图库</RouterLink>
          <RouterLink class="badge" to="/upload">上传</RouterLink>
          <RouterLink class="badge" to="/slideshow">轮播</RouterLink>
          <span v-if="!token"><RouterLink class="badge" to="/login">登录</RouterLink></span>
          <span v-else class="row" style="align-items:center">
            <span class="help">{{ user?.username || user?.email }}</span>
            <button class="badge" @click="logout">退出</button>
          </span>
        </nav>
      </div>
    </header>
    <RouterView />
  </div>
</template>
<script setup>
import { computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { setToken as setImgToken } from './services/images';
import { setToken as setTagToken } from './services/tags';

const store = useStore();
const token = computed(()=>store.state.token);
const user = computed(()=>store.state.user);
function logout(){ store.commit('logout'); location.href='/login'; }

onMounted(()=>{
  const t = localStorage.getItem('token');
  if (t){ setImgToken(t); setTagToken(t); }
  const u = localStorage.getItem('user');
  if (t && u && !user.value) store.commit('setAuth', { token:t, user: JSON.parse(u) });
});
</script>
<style>
@import './styles/base.css';
</style>