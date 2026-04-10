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
    <Notivue v-slot="item">
	    <Notification :item="item" />
    </Notivue>
  </NuxtLayout>
</template>
