<template>
  <div class="min-h-full flex flex-col">
    <div class="bg-grid" />
    <AppHeader />

    <main class="relative z-10 flex-1">
      <div class="mx-auto max-w-7xl px-6 py-8">
        <slot />
      </div>
    </main>
  </div>
</template>
