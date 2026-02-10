<template>
  <div class="container" v-if="img">
    <div class="panel">
      <div class="row" style="justify-content:space-between;align-items:center">
        <h3 style="margin:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
          {{ img.title || img.originalName || img.filename }}
        </h3>
        <div class="row">
          <button class="badge" @click="$router.back()">返回</button>
          <button class="badge danger" @click="remove">删除</button>
        </div>
      </div>
      <div class="sep"></div>

      <div class="row" style="align-items:flex-start;gap:16px;flex-wrap:wrap">
        <div class="img-stage"
             @pointerdown="startDrag"
             @pointermove="onDrag"
             @pointerup="endDrag"
             @pointerleave="endDrag">
          <img :src="img.originalPath" ref="imgEl" @load="onImgLoad" />
          <div v-if="sel.w>0 && sel.h>0" class="sel-box" :style="selStyle"></div>
        </div>

        <div style="flex:1;min-width:280px">
          <h4>标题</h4>
          <div class="row" style="align-items:center">
            <input v-model.trim="title" :placeholder="(img.title || '未命名')" style="flex:1" />
            <button class="badge" @click="saveTitle">保存标题</button>
            <button class="badge" @click="aiAuto">AI 打标</button>
          </div>
          <div class="sep"></div>

          <h4>元信息</h4>
          <div class="help">时间：{{ img.exifTakenAt ? new Date(img.exifTakenAt).toLocaleString() : '-' }}</div>
          <div class="help">地点：{{ formatCoords(img.exifLat, img.exifLng) }}</div>
          <div class="help">图片分辨率：{{ img.resolution || (img.width && img.height ? (img.width+'x'+img.height) : '-') }}</div>
          <div class="sep"></div>

          <h4>标签</h4>
          <div class="row" style="gap:6px;flex-wrap:wrap">
            <span class="badge"
                  v-for="t in (img.Tags||[])"
                  :key="t.id"
                  @click="removeTag(t.name)"
                  style="cursor:pointer"># {{ t.name }} ✕</span>
          </div>
          <div class="row" style="margin-top:8px">
            <input v-model.trim="tagInput" placeholder="输入标签，逗号分隔后回车保存" @keyup.enter="saveTags" style="flex:1"/>
            <button class="primary" @click="saveTags">保存</button>
          </div>
          <p class="help" v-if="tagMsg" :style="{color:tagOk? 'var(--ok)':'var(--danger)'}">{{ tagMsg }}</p>
          <div class="sep"></div>

          <h4>编辑</h4>
          <div class="row" style="align-items:center;gap:18px;flex-wrap:wrap">
            <div class="row" style="align-items:center;gap:8px">
              <span class="help">亮度</span>
              <input type="range" min="0.2" max="2" step="0.05" v-model.number="brightness" />
              <span class="help">{{ brightness.toFixed(2) }}</span>
            </div>
            <div class="row" style="align-items:center;gap:8px">
              <span class="help">饱和</span>
              <input type="range" min="0.2" max="2" step="0.05" v-model.number="saturation" />
              <span class="help">{{ saturation.toFixed(2) }}</span>
            </div>
            <div class="row" style="align-items:center;gap:8px">
              <span class="help">对比</span>
              <input type="range" min="0.2" max="2" step="0.05" v-model.number="contrast" />
              <span class="help">{{ contrast.toFixed(2) }}</span>
            </div>
            <button class="ghost" @click="clearSel">清除裁剪</button>
            <button class="primary" @click="applyEdit">应用编辑</button>
            <span class="help" v-if="editMsg" :style="{color:editOk? 'var(--ok)':'var(--danger)'}">{{ editMsg }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  getImage,
  addTags,
  addTagsAppend,
  editImage,
  deleteImage,
  updateMeta,
  aiTag
} from '../services/images';

const r = useRoute(); const nav = useRouter();
const img = ref(null);
const tagInput = ref(''); const tagMsg = ref(''); const tagOk = ref(false);

const imgEl = ref(null);
const natural = ref({ w:0,h:0 });
const dragging = ref(false);
const start = ref({ x:0,y:0 });
const sel = ref({ x:0,y:0,w:0,h:0 });

const brightness = ref(1); const saturation = ref(1); const contrast = ref(1);
const editMsg = ref(''); const editOk = ref(false);

const title = ref('');

function onImgLoad(){
  const el = imgEl.value;
  // 图片真实像素尺寸
  natural.value = { w: el.naturalWidth, h: el.naturalHeight };
}
function startDrag(e){
  if (!imgEl.value) return;
  dragging.value = true;
  const p = point(e);
  start.value = p;
  sel.value = { x:p.x, y:p.y, w:0, h:0 };
}
function onDrag(e){
  if (!dragging.value) return;
  const p = point(e);
  // 把拖拽起点和当前点转换为左上角 + 宽高
  sel.value = {
    x: Math.min(p.x,start.value.x),
    y: Math.min(p.y,start.value.y),
    w: Math.abs(p.x-start.value.x),
    h: Math.abs(p.y-start.value.y)
  };
}
function endDrag(){ dragging.value = false; }
function clearSel(){ sel.value = { x:0,y:0,w:0,h:0 }; }

function point(e){
  const rect = imgEl.value.getBoundingClientRect();
  // clientX/Y 是相对视口坐标，减去 rect.left/top 得到相对图片显示区域的坐标
  const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
  const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
  return { x, y };
}

const selStyle = computed(()=>({
  left: sel.value.x + 'px',
  top: sel.value.y + 'px',
  width: sel.value.w + 'px',
  height: sel.value.h + 'px'
}));

async function load(){
  const { data } = await getImage(r.params.id);
  img.value = data;
  title.value = data.title || '';
}

function removeTag(name){
  const names = (img.value?.Tags||[]).map(t=>t.name).filter(n=> n!==name);
  saveTags(names);
}

async function saveTags(names){
  tagMsg.value=''; tagOk.value=false;
  try{
    if (Array.isArray(names)) {
      const { data } = await addTags(img.value.id, names);
      img.value = data; tagOk.value=true; tagMsg.value='已保存标签';
    } else {
      const tags = tagInput.value.split(',').map(s=>s.trim()).filter(Boolean);
      if (!tags.length) return;
      const { data } = await addTagsAppend(img.value.id, tags);
      img.value = data; tagInput.value=''; tagOk.value=true; tagMsg.value='已追加标签';
    }
  }catch(e){
    tagOk.value=false; tagMsg.value = e.response?.data?.message || '保存失败';
  }
}

// 把显示坐标系的选框换算成原图像素坐标发给后端 sharp.extract
function computeCrop(){
  if (!(sel.value.w>0 && sel.value.h>0)) return null;
  const rect = imgEl.value.getBoundingClientRect();
  // scaleX/Y：原图像素 / 当前显示像素
  const scaleX = (img.value?.width || natural.value.w) / rect.width;
  const scaleY = (img.value?.height || natural.value.h) / rect.height;
  return {
    left: Math.round(sel.value.x * scaleX),
    top: Math.round(sel.value.y * scaleY),
    width: Math.round(sel.value.w * scaleX),
    height: Math.round(sel.value.h * scaleY)
  };
}

async function applyEdit(){
  editMsg.value=''; editOk.value=false;
  try{
    const crop = computeCrop();
    // 将 crop + 亮度/饱和/对比 发送给后端
    await editImage(img.value.id, { crop, brightness: brightness.value, saturation: saturation.value, contrast: contrast.value });
    // 编辑成功后重新拉取详情
    await load();
    editOk.value=true; editMsg.value='已应用编辑';
  }catch(e){
    editOk.value=false; editMsg.value = e.response?.data?.message || '编辑失败';
  }
}

async function saveTitle(){
  try {
    await updateMeta(img.value.id, { title: title.value });
    await load();
  } catch(e) {
    alert(e.response?.data?.message || '保存标题失败');
  }
}

async function aiAuto(){
  try {
    const { data } = await aiTag(img.value.id);
    if (data?.image) img.value = data.image;
  } catch(e) {
    alert(e.response?.data?.message || 'AI 打标失败');
  }
}

async function remove(){
  if (!confirm('确认删除？')) return;
  await deleteImage(img.value.id);
  nav.push('/gallery');
}

function formatCoords(lat, lng) {
  const a = Number(lat);
  const b = Number(lng);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return '-';
  return `${a.toFixed(4)}, ${b.toFixed(4)}`;
}

onMounted(load);
</script>
