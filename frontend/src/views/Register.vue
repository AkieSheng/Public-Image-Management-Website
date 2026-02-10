<template>
  <div class="container">
    <div class="panel">
      <h2>注册</h2>
      <div class="sep"></div>
      <form class="row" @submit.prevent="submit">
        <input v-model.trim="form.username" placeholder="用户名(≥3)" required minlength="3" style="flex:1"/>
        <input v-model.trim="form.email" placeholder="Email" type="email" required style="flex:1"/>
        <input v-model="form.password" placeholder="密码(≥6)" type="password" required minlength="6" style="flex:1"/>
        <button class="primary" style="min-width:120px">注册</button>
      </form>
      <p class="help" v-if="err" style="color:var(--danger)">{{ err }}</p>
      <p class="help">已有账号？<RouterLink to="/login">去登录</RouterLink></p>
    </div>
  </div>
</template>
<script setup>
import { ref } from 'vue';
import { register } from '../services/auth';
const form = ref({ username:'', email:'', password:'' });
const err = ref('');
async function submit(){
  err.value='';
  try{ await register(form.value); location.href='/login'; }
  catch(e){ err.value = e.response?.data?.message || '注册失败'; }
}
</script>