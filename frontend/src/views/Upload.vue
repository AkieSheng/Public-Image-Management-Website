<template>
  <div class="container">
    <div class="panel">
      <h2>上传图片</h2>
      <div class="sep"></div>
      <div class="row">
        <input type="file" accept="image/*" @change="pick">
        <input v-model.trim="title" placeholder="图片标题（推荐填写）" style="flex:1">
        <input v-model.trim="tagInput" placeholder="初始标签，逗号分隔（可选）" style="flex:1">
        <button class="primary" :disabled="!file" @click="doUpload">上传</button>
        <div class="help" v-if="file">{{ file.name }} ({{ Math.round(file.size/1024) }} KB)</div>
      </div>
      <div v-if="progress>0" class="help">上传进度：{{ progress }}%</div>
      <p v-if="msg" class="help" :style="{color:ok? 'var(--ok)':'var(--danger)'}">{{ msg }}</p>
    </div>
  </div>
</template>
<script setup>
import { ref } from 'vue';
import { uploadImage } from '../services/images';

const file = ref(null); const msg = ref(''); const ok = ref(false); const progress = ref(0);
const title = ref(''); const tagInput = ref('');
function pick(e){ file.value = e.target.files[0]; msg.value=''; progress.value=0; }
async function doUpload(){
  msg.value=''; ok.value=false; progress.value=0;
  try{
    const tags = tagInput.value.split(',').map(s=>s.trim()).filter(Boolean);
    const { data } = await uploadImage(file.value, p=> progress.value=p, { title: title.value, tags });
    ok.value=true; msg.value=`已上传：#${data.id}`; file.value=null; title.value=''; tagInput.value='';
  }catch(e){ ok.value=false; msg.value = e.response?.data?.message || '上传失败'; }
}
</script>