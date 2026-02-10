<template>
  <div class="container">
    <div class="panel">
      <div class="row" style="justify-content:space-between;align-items:center">
        <h2>轮播</h2>
        <div class="row">
          <button class="badge" @click="prev">上一张</button>
          <button class="badge" @click="toggle">{{ playing? '暂停':'播放' }}</button>
          <button class="badge" @click="next">下一张</button>
          <select v-model.number="intervalMs">
            <option :value="2000">2s</option>
            <option :value="3000">3s</option>
            <option :value="5000">5s</option>
          </select>
        </div>
      </div>
    </div>

    <div style="height:12px"></div>

    <div class="panel" style="display:flex;align-items:center;justify-content:center;min-height:70vh">
      <img v-if="current" :src="current.originalPath || current.thumbPath" style="max-width:96%;max-height:76vh;border-radius:12px;border:1px solid var(--muted)"/>
      <div v-else class="help">没有可轮播的图片</div>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted, watchEffect, onBeforeUnmount } from 'vue';
import { listImages } from '../services/images';

const list = ref([]); const idx = ref(0); const current = ref(null);
const playing = ref(true); const intervalMs = ref(3000); let timer=null;

function tick(){ if(!list.value.length) return; idx.value = (idx.value + 1) % list.value.length; current.value = list.value[idx.value]; }
function prev(){ if(!list.value.length) return; idx.value = (idx.value - 1 + list.value.length) % list.value.length; current.value = list.value[idx.value]; }
function next(){ tick(); }
function toggle(){ playing.value = !playing.value; setup(); }

function setup(){ if (timer) { clearInterval(timer); timer=null; } if (playing.value && list.value.length) timer=setInterval(tick, intervalMs.value); }

onMounted(async ()=>{
  const raw = sessionStorage.getItem('slideData') || '[]'; try{ list.value = JSON.parse(raw)||[]; }catch{ list.value=[]; }
  if (!list.value.length) { const { data } = await listImages(); list.value = data||[]; }
  current.value = list.value[0] || null; setup();
});
watchEffect(setup);
onBeforeUnmount(()=>{ if (timer) clearInterval(timer); });
</script>