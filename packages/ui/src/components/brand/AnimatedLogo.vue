<script setup lang="ts">
defineProps({ animate: { type: Boolean, default: false } })
</script>

<template>
  <svg viewBox="0 0 64 64" role="img" aria-label="FAKEDRINH" :class="{ animate }" xmlns="http://www.w3.org/2000/svg">
    <path fill="#8f101b" d="M8 18 32 6l24 12v30L32 60 8 48z" />
    <path fill="#ed2939" d="m8 18 24 12v30L8 48z" />
    <path fill="#c41627" d="m32 30 24-12v30L32 60z" />
    <path fill="#ff5361" d="m8 18 24-12 24 12-24 12z" />
    <path fill="#7b0b15" d="M20 18h8v8h-8zm16 0h8v8h-8zM26 34h12v8h-4v8h-4v-8h-4z" />
  </svg>
</template>

<style scoped>
svg { width: 5rem; height: 5rem; }
.animate { animation: spin 3s linear infinite; transform-origin: center; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
