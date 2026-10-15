<script setup lang="ts">
defineProps({ animate: { type: Boolean, default: false } })
</script>

<template>
  <span class="inline-flex items-center gap-2" :class="{ animate }" aria-label="FAKEDRINH">
    <svg viewBox="0 0 64 64" class="h-8 w-8" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <path fill="#8f101b" d="M8 18 32 6l24 12v30L32 60 8 48z" />
      <path fill="#ed2939" d="m8 18 24 12v30L8 48z" />
      <path fill="#c41627" d="m32 30 24-12v30L32 60z" />
      <path fill="#ff5361" d="m8 18 24-12 24 12-24 12z" />
    </svg>
    <span class="font-semibold tracking-wide text-contrast">FAKEDRINH</span>
  </span>
</template>
