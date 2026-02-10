<template>
  <div class="row" style="gap:6px;flex-wrap:wrap">
    <span class="badge" v-for="t in tags" :key="t" @click="$emit('remove', t)" style="cursor:pointer"># {{ t }} ✕</span>
  </div>
</template>
<script setup>
defineProps({ tags: { type:Array, default:()=>[] } });
</script>