<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { NodeResizer } from '@vue-flow/node-resizer'
import '@vue-flow/node-resizer/dist/style.css'
import type { NodeProps } from '@vue-flow/core'
import { COMMENT_DEFAULT_HEIGHT, COMMENT_DEFAULT_WIDTH, type CommentNodeData } from '~/composables/useSupplyChain'

const COMMENT_COLORS: { id: string; bg: string; border: string }[] = [
  { id: 'zinc', bg: 'bg-zinc-800/40', border: 'border-zinc-600/40' },
  { id: 'blue', bg: 'bg-blue-900/30', border: 'border-blue-600/40' },
  { id: 'green', bg: 'bg-green-900/30', border: 'border-green-600/40' },
  { id: 'amber', bg: 'bg-amber-900/30', border: 'border-amber-600/40' },
  { id: 'purple', bg: 'bg-purple-900/30', border: 'border-purple-600/40' },
]

const props = defineProps<NodeProps<CommentNodeData>>()

const emit = defineEmits<{
  remove: [nodeId: string]
}>()

const colorId = ref(props.data.color ?? 'zinc')
const text = ref(props.data.text ?? '')

const currentColor = computed(() =>
  COMMENT_COLORS.find(c => c.id === colorId.value) ?? COMMENT_COLORS[0]!,
)

function onTextInput(event: Event) {
  const el = event.target as HTMLTextAreaElement
  text.value = el.value
  props.data.text = el.value
}

function setColor(id: string) {
  colorId.value = id
  props.data.color = id
}

function onResize({ params }: { params: { width: number; height: number } }) {
  props.data.width = params.width
  props.data.height = params.height
}

// Sync back if changed externally (e.g. undo/redo)
watch(() => props.data.text, (v) => { text.value = v ?? '' })
watch(() => props.data.color, (v) => { colorId.value = v ?? 'zinc' })
</script>

<template>
  <div
    class="group relative rounded-md border border-dashed transition-colors font-mono"
    :class="[currentColor.bg, currentColor.border]"
    :style="{
      width: (props.data.width ?? COMMENT_DEFAULT_WIDTH) + 'px',
      height: (props.data.height ?? COMMENT_DEFAULT_HEIGHT) + 'px',
    }"
  >
    <NodeResizer
      :min-width="150"
      :min-height="80"
      @resize="onResize"
    />

    <!-- Color dots + delete — top-right corner, visible on hover -->
    <div
      class="nodrag absolute top-1.5 right-1.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
    >
      <button
        v-for="c in COMMENT_COLORS"
        :key="c.id"
        type="button"
        class="w-3.5 h-3.5 rounded-full border-2 cursor-pointer transition-transform hover:scale-125"
        :class="[
          c.bg,
          c.border,
          colorId === c.id ? 'ring-1 ring-white/60 scale-110' : '',
        ]"
        @click.stop="setColor(c.id)"
        @mousedown.stop
      />
      <button
        type="button"
        class="ml-1 w-5 h-5 text-zinc-500 hover:text-rose-400 flex items-center justify-center cursor-pointer transition-colors text-[14px]"
        @click.stop="emit('remove', props.id)"
        @mousedown.stop
      >✕</button>
    </div>

    <!-- Editable text area -->
    <textarea
      :value="text"
      placeholder="Заметка..."
      class="nodrag nowheel w-full h-full bg-transparent text-zinc-300 text-[13px] leading-relaxed p-3 pt-7 resize-none outline-none placeholder:text-zinc-600 font-mono"
      @input="onTextInput"
    />
  </div>
</template>
