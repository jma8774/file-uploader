<script setup lang="ts">
import { computed, ref } from 'vue'
import { MAX_UPLOAD_BYTES } from '../api'
import { formatBytes } from '../utils/formatBytes'

const emit = defineEmits<{
  select: [file: File]
  reset: []
}>()

const file = ref<File | null>(null)
const error = ref<string | null>(null)
const isDragging = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

const state = computed<'idle' | 'selected'>(() => (file.value ? 'selected' : 'idle'))

function pickFile(picked: File | null | undefined) {
  if (!picked) return
  if (picked.size > MAX_UPLOAD_BYTES) {
    error.value = 'File is too large. Max size is 100 MB.'
    file.value = null
    return
  }
  error.value = null
  file.value = picked
  emit('select', picked)
}

function onFileInput(ev: Event) {
  const input = ev.target as HTMLInputElement
  const picked = input.files?.[0]
  pickFile(picked)
  // Allow re-selecting the same file after a reset.
  input.value = ''
}

function onDrop(ev: DragEvent) {
  isDragging.value = false
  const picked = ev.dataTransfer?.files?.[0]
  pickFile(picked)
}

function onDragOver(ev: DragEvent) {
  if (ev.dataTransfer) ev.dataTransfer.dropEffect = 'copy'
  isDragging.value = true
}

function onDragLeave() {
  isDragging.value = false
}

function onUploadClick() {
  if (!file.value) {
    error.value = 'Please choose a file before uploading.'
    return
  }
  // EMULATED: real upload wiring lands in TICKET-006. For now this is a noop
  // so the button is visible and clickable but does nothing.
  console.log('[EMULATED] Upload clicked for', file.value.name, file.value.size)
}

function reset() {
  file.value = null
  error.value = null
  if (fileInput.value) fileInput.value.value = ''
  emit('reset')
}
</script>

<template>
  <div class="uploader">
    <label
      class="dropzone"
      :class="{ 'is-dragging': isDragging, 'has-error': !!error }"
      @dragover.prevent="onDragOver"
      @dragenter.prevent="onDragOver"
      @dragleave.prevent="onDragLeave"
      @drop.prevent="onDrop"
    >
      <input
        ref="fileInput"
        type="file"
        class="dropzone-input"
        @change="onFileInput"
      />
      <span class="dropzone-label">Drop file here or click to choose</span>
    </label>

    <p v-if="error" class="error" role="alert">{{ error }}</p>

    <div v-if="state === 'selected' && file" class="selection">
      <p class="selection-line">
        <strong>Selected:</strong>
        {{ file.name }} — {{ formatBytes(file.size) }}
      </p>
      <div class="actions">
        <button type="button" class="upload-btn" @click="onUploadClick">Upload</button>
        <button type="button" class="reset-btn" @click="reset">Reset</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.uploader {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dropzone {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 140px;
  padding: 24px;
  border: 2px dashed #b5b5b5;
  border-radius: 8px;
  cursor: pointer;
  text-align: center;
  transition: border-color 120ms ease, background-color 120ms ease;
}

.dropzone:hover,
.dropzone:focus-within {
  border-color: #555;
}

.dropzone.is-dragging {
  border-color: #2b6cb0;
  background-color: rgba(43, 108, 176, 0.06);
}

.dropzone.has-error {
  border-color: #c53030;
}

.dropzone-input {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.dropzone-label {
  color: #555;
}

.error {
  margin: 0;
  color: #c53030;
}

.selection {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.selection-line {
  margin: 0;
}

.actions {
  display: flex;
  gap: 8px;
}

.upload-btn,
.reset-btn {
  padding: 8px 16px;
  font: inherit;
  border-radius: 6px;
  border: 1px solid #ccc;
  background: #fff;
  cursor: pointer;
}

.upload-btn {
  background: #1f2937;
  color: #fff;
  border-color: #1f2937;
}
</style>
