<script setup lang="ts">
import { computed, ref } from 'vue'
import { ApiError, MAX_UPLOAD_BYTES, uploadFile, type UploadResponse } from '../api'
import { formatBytes } from '../utils/formatBytes'

type UploadState = 'idle' | 'selected' | 'uploading' | 'success' | 'error'

const emit = defineEmits<{
  select: [file: File]
  uploaded: [response: UploadResponse]
  reset: []
}>()

const state = ref<UploadState>('idle')
const file = ref<File | null>(null)
const error = ref<string | null>(null)
const progress = ref(0)
const isDragging = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

const canInteract = computed(() => state.value !== 'uploading')

function pickFile(picked: File | null | undefined) {
  if (!picked) return
  if (picked.size > MAX_UPLOAD_BYTES) {
    error.value = 'File is too large. Max size is 100 MB.'
    state.value = 'error'
    file.value = null
    return
  }
  error.value = null
  file.value = picked
  state.value = 'selected'
  emit('select', picked)
}

function onFileInput(ev: Event) {
  const input = ev.target as HTMLInputElement
  pickFile(input.files?.[0])
  input.value = ''
}

function onDrop(ev: DragEvent) {
  isDragging.value = false
  if (!canInteract.value) return
  pickFile(ev.dataTransfer?.files?.[0])
}

function onDragOver(ev: DragEvent) {
  if (!canInteract.value) return
  if (ev.dataTransfer) ev.dataTransfer.dropEffect = 'copy'
  isDragging.value = true
}

function onDragLeave() {
  isDragging.value = false
}

async function onUploadClick() {
  if (state.value === 'uploading') return
  if (!file.value) {
    error.value = 'Please choose a file before uploading.'
    state.value = 'error'
    return
  }

  state.value = 'uploading'
  progress.value = 0
  error.value = null

  try {
    const response = await uploadFile(file.value, (pct) => {
      progress.value = pct
    })
    state.value = 'success'
    emit('uploaded', response)
  } catch (err) {
    if (err instanceof ApiError) {
      error.value = err.message
    } else {
      error.value = 'Upload failed. Please try again.'
    }
    state.value = 'error'
  }
}

// Try again returns to 'selected' with the same file kept, so the user
// doesn't have to re-pick after a transient failure. If there's no file
// (validation rejected before selection), drop to 'idle'.
function tryAgain() {
  error.value = null
  progress.value = 0
  state.value = file.value ? 'selected' : 'idle'
}

function reset() {
  file.value = null
  error.value = null
  progress.value = 0
  state.value = 'idle'
  if (fileInput.value) fileInput.value.value = ''
  emit('reset')
}
</script>

<template>
  <div class="uploader">
    <label
      class="dropzone"
      :class="{
        'is-dragging': isDragging,
        'has-error': state === 'error',
        'is-disabled': !canInteract,
      }"
      @dragover.prevent="onDragOver"
      @dragenter.prevent="onDragOver"
      @dragleave.prevent="onDragLeave"
      @drop.prevent="onDrop"
    >
      <input
        ref="fileInput"
        type="file"
        class="dropzone-input"
        :disabled="!canInteract"
        @change="onFileInput"
      />
      <span class="dropzone-label">Drop file here or click to choose</span>
    </label>

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

    <div v-if="state === 'uploading'" class="progress" aria-live="polite">
      <p class="progress-line">Upload progress: {{ progress }}%</p>
      <progress class="progress-bar" :value="progress" max="100" />
    </div>

    <div v-if="state === 'error'" class="error-block" role="alert">
      <p class="error">{{ error }}</p>
      <div class="actions">
        <button type="button" class="upload-btn" @click="tryAgain">Try again</button>
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

.dropzone.is-disabled {
  cursor: not-allowed;
  opacity: 0.6;
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

.selection,
.error-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.selection-line,
.progress-line {
  margin: 0;
}

.progress {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.progress-bar {
  width: 100%;
  height: 8px;
}

.error {
  margin: 0;
  color: #c53030;
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

.upload-btn:disabled,
.reset-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
