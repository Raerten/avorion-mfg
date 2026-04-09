<template>
  <div class="min-h-full flex flex-col">
    <AppHeader />

    <main class="flex-1">
      <div class="mx-auto max-w-7xl px-6 py-8">
        <slot />
      </div>
    </main>
  </div>
</template>
