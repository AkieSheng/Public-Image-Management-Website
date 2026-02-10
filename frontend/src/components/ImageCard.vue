<template>
  <div class="panel" style="padding:0;overflow:hidden">
    <div style="position:relative">
      <img :src="image.thumbPath" :alt="image.title || image.originalName || image.filename" style="width:100%;display:block" @click="$emit('open', image.id)"/>
      <div style="position:absolute;bottom:8px;left:8px;display:flex;gap:6px;flex-wrap:wrap">
        <span class="badge" v-if="image.resolution">{{ image.resolution }}</span>
        <span class="badge" v-if="image.exifTakenAt">{{ new Date(image.exifTakenAt).toLocaleDateString() }}</span>
      </div>
    </div>
    <div style="padding:10px">
      <div class="row" style="justify-content:space-between;align-items:center">
        <div class="help" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:60%">
          {{ image.title || image.originalName || image.filename }}
        </div>
        <div class="row">
          <button class="badge" @click="$emit('open', image.id)">详情</button>
          <button class="badge danger" @click="$emit('delete', image.id)">删除</button>
        </div>
      </div>
      <div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:6px">
        <span v-for="t in image.Tags || []" :key="t.id" class="badge"># {{ t.name }}</span>
      </div>
    </div>
  </div>
</template>
<script setup>
defineProps({ image:Object });
</script>