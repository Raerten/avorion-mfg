<script setup lang="ts">
const { baseURL } = useRuntimeConfig().app
useHead({
  link: [
    { rel: 'icon', type: 'image/svg+xml', href: `${baseURL}favicon.svg` },
  ],
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
