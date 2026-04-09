<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  getCanvasList,
  getActiveCanvasId,
  setActiveCanvas,
  createCanvas,
  renameCanvas,
  deleteCanvas,
  exportCanvas,
  importCanvas,
  type CanvasMeta,
} from '~/composables/useSupplyChain'

const emit = defineEmits<{
  switch: [id: string]
  clear: []
}>()

const list = ref<CanvasMeta[]>(getCanvasList())
const activeId = ref(getActiveCanvasId())

const activeCanvas = computed(() => list.value.find(c => c.id === activeId.value))

function refresh() {
  list.value = getCanvasList()
  activeId.value = getActiveCanvasId()
}

// --- Switch canvas ---

const dropdownOpen = ref(false)

function onSwitch(id: string) {
  if (id === activeId.value) return
  setActiveCanvas(id)
  activeId.value = id
  dropdownOpen.value = false
  emit('switch', id)
}

// --- Create ---

function onCreate() {
  const name = prompt('Название нового холста:', `Холст ${list.value.length + 1}`)
  if (!name) return
  const id = createCanvas(name)
  refresh()
  emit('switch', id)
}

// --- Rename ---

function onRename() {
  const current = activeCanvas.value
  if (!current) return
  const name = prompt('Новое название:', current.name)
  if (!name || name === current.name) return
  renameCanvas(current.id, name)
  refresh()
}

// --- Delete ---

function onDelete() {
  if (list.value.length <= 1) return
  const current = activeCanvas.value
  if (!current) return
  if (!confirm(`Удалить холст «${current.name}»?`)) return
  deleteCanvas(current.id)
  refresh()
  emit('switch', getActiveCanvasId())
}

// --- Download ---

function onDownload() {
  const exported = exportCanvas()
  if (!exported) return
  const blob = new Blob([JSON.stringify(exported, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${exported.name.replace(/[^a-zA-Zа-яА-ЯёЁ0-9 _-]/g, '')}.json`
  a.click()
  URL.revokeObjectURL(url)
}

// --- Upload ---

const fileInput = ref<HTMLInputElement | null>(null)

function onUploadClick() {
  fileInput.value?.click()
}

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    try {
      const id = importCanvas(reader.result as string)
      refresh()
      emit('switch', id)
    } catch (e) {
      alert('Ошибка при импорте: ' + (e instanceof Error ? e.message : 'неизвестная ошибка'))
    }
  }
  reader.readAsText(file)
  // Reset so re-uploading the same file triggers change
  input.value = ''
}

const dropdownRef = ref<HTMLElement | null>(null)
const toggleRef = ref<HTMLElement | null>(null)

function onDocumentClick(e: MouseEvent) {
  if (!dropdownOpen.value) return
  const target = e.target as Node
  if (dropdownRef.value?.contains(target)) return
  if (toggleRef.value?.contains(target)) return
  dropdownOpen.value = false
}

onMounted(() => document.addEventListener('click', onDocumentClick))
onUnmounted(() => document.removeEventListener('click', onDocumentClick))
</script>

<template>
  <div class="flex items-center gap-1.5">
    <!-- Canvas switcher -->
    <div class="relative">
      <button
        ref="toggleRef"
        type="button"
        class="text-xs px-3 py-1.5 rounded border border-border hover:bg-muted text-muted-foreground hover:text-foreground flex items-center gap-1.5 max-w-48 cursor-pointer"
        @click="dropdownOpen = !dropdownOpen"
      >
        <span class="truncate">{{ activeCanvas?.name ?? 'Холст' }}</span>
        <svg class="w-3 h-3 shrink-0 opacity-60" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M3 5l3 3 3-3" />
        </svg>
      </button>

      <div
        v-if="dropdownOpen"
        ref="dropdownRef"
        class="absolute top-full left-0 mt-1 w-56 bg-card border border-border rounded-md shadow-lg z-50 py-1 max-h-64 overflow-y-auto"
      >
        <button
          v-for="canvas in list"
          :key="canvas.id"
          type="button"
          class="w-full text-left text-xs px-3 py-1.5 hover:bg-muted flex items-center gap-2 cursor-pointer"
          :class="canvas.id === activeId ? 'text-foreground bg-muted/50' : 'text-muted-foreground'"
          @click="onSwitch(canvas.id)"
        >
          <span v-if="canvas.id === activeId" class="text-primary">●</span>
          <span v-else class="opacity-0">●</span>
          <span class="truncate">{{ canvas.name }}</span>
        </button>

        <div class="border-t border-border my-1" />

        <button
          type="button"
          class="w-full text-left text-xs px-3 py-1.5 hover:bg-muted text-muted-foreground cursor-pointer"
          @click="onCreate(); dropdownOpen = false"
        >+ Новый холст</button>
      </div>
    </div>

    <!-- Rename -->
    <button
      type="button"
      title="Переименовать холст"
      class="text-xs px-2 py-1.5 rounded border border-border hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
      @click="onRename"
    >
      <svg class="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M11.5 1.5l3 3-9 9H2.5v-3z" />
      </svg>
    </button>

    <!-- Delete -->
    <button
      type="button"
      title="Удалить холст"
      class="text-xs px-2 py-1.5 rounded border border-border hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer"
      :disabled="list.length <= 1"
      @click="onDelete"
    >
      <svg class="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M3 4h10M5.5 4V3a1 1 0 011-1h3a1 1 0 011 1v1M6 7v5M10 7v5M4 4l.5 9a1 1 0 001 1h5a1 1 0 001-1L12 4" />
      </svg>
    </button>

    <div class="w-px h-5 bg-border mx-0.5" />

    <!-- Download -->
    <button
      type="button"
      title="Скачать холст"
      class="text-xs px-2 py-1.5 rounded border border-border hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
      @click="onDownload"
    >
      <svg class="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M8 2v8M5 7l3 3 3-3M3 12h10" />
      </svg>
    </button>

    <!-- Upload -->
    <button
      type="button"
      title="Загрузить холст"
      class="text-xs px-2 py-1.5 rounded border border-border hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
      @click="onUploadClick"
    >
      <svg class="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M8 10V2M5 5l3-3 3 3M3 12h10" />
      </svg>
    </button>
    <input
      ref="fileInput"
      type="file"
      accept=".json"
      class="hidden"
      @change="onFileChange"
    >

    <div class="w-px h-5 bg-border mx-0.5" />

    <!-- Clear canvas -->
    <button
      type="button"
      title="Очистить холст"
      class="text-xs px-3 py-1.5 rounded border border-border hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
      @click="$emit('clear')"
    >Очистить</button>
  </div>
</template>
