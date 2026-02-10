<template>
  <div class="container">
    <div class="panel">
      <h2>登录</h2>
      <div class="sep"></div>
      <form class="row" @submit.prevent="submit">
        <input v-model.trim="email" placeholder="Email" type="email" required style="flex:1"/>
        <input v-model="password" placeholder="密码" type="password" required minlength="6" style="flex:1"/>
        <button class="primary" style="min-width:120px">登录</button>
      </form>
      <p class="help" v-if="err" style="color:var(--danger)">{{ err }}</p>
      <p class="help">没有账号？<RouterLink to="/register">去注册</RouterLink></p>
    </div>
  </div>
</template>
<script setup>
import { ref } from 'vue';
import store from '../store';
import { login } from '../services/auth';
import { setToken as setImgToken } from '../services/images';
import { setToken as setTagToken } from '../services/tags';

const email = ref('');
const password = ref('');
const err = ref('');

async function submit(){
  err.value='';
  try{
    const { data } = await login({ email: email.value, password: password.value });
    // 把 token 写入两个 service
    setImgToken(data.token); setTagToken(data.token);
    // 写入 Vuex
    store.commit('setAuth', data);
    location.href = '/gallery';
  }catch(e){ err.value = e.response?.data?.message || '登录失败'; }
}
</script>