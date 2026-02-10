<template>
  <div class="container">
    <div class="panel">
      <div class="row" style="align-items:center;justify-content:space-between">
        <h2>图库</h2>
        <div class="row">
          <button class="badge" @click="$router.push('/upload')">上传</button>
          <button class="badge" @click="toSlide">轮播</button>
        </div>
      </div>
      <div class="sep"></div>
      <div class="row" style="gap:8px">
        <input v-model.trim="q" placeholder="搜索 原始名/文件名/标题/备注" style="flex:2" @keyup.enter="load"/>
        <div class="icon-input" style="flex:1">
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M7 2h10v2h3a1 1 0 0 1 1 1v3H3V5a1 1 0 0 1 1-1h3V2Zm14 8v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-9h18Z"/></svg>
          <input type="date" v-model="dateFrom" placeholder="起始日期" />
        </div>
        <div class="icon-input" style="flex:1">
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M7 2h10v2h3a1 1 0 0 1 1 1v3H3V5a1 1 0 0 1 1-1h3V2Zm14 8v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-9h18Z"/></svg>
          <input type="date" v-model="dateTo" placeholder="结束日期" />
        </div>
        <input v-model.trim="tags" placeholder="标签(逗号分隔)" style="flex:1" @keyup.enter="load">
        <button class="primary" @click="load">查询</button>
        <button class="ghost" @click="reset">重置</button>
      </div>
            <div class="panel" style="margin-top:12px">
        <div class="row" style="align-items:center;justify-content:space-between">
          <h3 style="margin:0">MCP检索</h3>
          <button class="badge" @click="runMcp" :disabled="mcpBusy">{{ mcpBusy ? '检索中…' : '执行' }}</button>
        </div>
        <div class="row" style="margin-top:8px">
          <textarea v-model.trim="prompt" rows="3"
            style="width:100%"></textarea>
        </div>
        <p class="help">提示：#后跟标签；可写“YYYY-MM-DD 到 YYYY-MM-DD”或单个日期；其它字样作为关键词。</p>
      </div>
    </div>

    <div style="height:12px"></div>

    <div class="grid">
      <ImageCard v-for="im in paged" :key="im.id" :image="im" @open="open" @delete="confirmDelete"/>
    </div>

    <div class="container" style="display:flex;justify-content:center;gap:8px;margin:16px 0">
      <button :disabled="page===1" @click="page--">上一页</button>
      <span class="help">{{ page }}/{{ pages }}</span>
      <button :disabled="page===pages" @click="page++">下一页</button>
    </div>
  </div>
</template>
<script setup>
import { ref, computed, onMounted } from 'vue';
import ImageCard from '../components/ImageCard.vue';
import { listImages, search, deleteImage } from '../services/images';
import { mcpQuery } from '../services/images';

const prompt = ref('');          // MCP 输入
const mcpBusy = ref(false);      // MCP 请求中的禁用态

const images = ref([]);          // 当前页面展示的数据源
const q = ref('');               // 关键词
const dateFrom = ref('');        // 起始日期
const dateTo = ref('');          // 结束日期
const tags = ref('');            // 标签

const page = ref(1);             // 当前页
const size = ref(16);            // 每页条数

// 总页数
const pages = computed(()=> Math.max(1, Math.ceil(images.value.length/size.value)));
// 当前页数据
const paged = computed(()=> images.value.slice((page.value-1)*size.value, page.value*size.value));

async function load(){
  page.value = 1;
  const params = {};
  if (q.value) params.q = q.value;
  if (dateFrom.value) params.dateFrom = dateFrom.value;
  if (dateTo.value) params.dateTo = dateTo.value;
  if (tags.value) params.tags = tags.value;
  const { data } = Object.keys(params).length ? await search(params) : await listImages();
  images.value = data;
}
function reset(){ q.value=''; dateFrom.value=''; dateTo.value=''; tags.value=''; load(); }
// 打开详情
function open(id){ location.href=`/image/${id}`; }
// 删除
async function confirmDelete(id){ if (!confirm('确认删除该图片？')) return; await deleteImage(id); await load(); }
// 跳轮播
function toSlide(){ sessionStorage.setItem('slideData', JSON.stringify(images.value)); location.href='/slideshow'; }

function adaptMcpResults(items){
  return (items||[]).map(r => ({
    id: r.id,
    filename: r.title || `#${r.id}`,
    originalPath: r.url,
    thumbPath: r.thumb || r.url,
    resolution: r.resolution || null,
    exifTakenAt: r.takenAt || null,
    Tags: (r.tags||[]).map((name,idx)=>({ id: `${r.id}-${idx}`, name }))
  }));
}

async function runMcp(){
  if (!prompt.value) return alert('请输入查询语句');
  mcpBusy.value = true;
  try{
    const { data } = await mcpQuery(prompt.value);
    images.value = adaptMcpResults(data?.results);
    page.value = 1;
  }catch(e){
    alert(e.response?.data?.message || '对话检索失败');
  }finally{
    mcpBusy.value = false;
  }
}

onMounted(load);
</script>