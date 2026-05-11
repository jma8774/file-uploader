<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  CheckCircle2,
  CloudUpload,
  FileText,
  Lock,
  TriangleAlert,
  X,
} from 'lucide-vue-next'
import { ApiError, MAX_UPLOAD_BYTES, uploadFile, type UploadResponse } from '../api'
import { formatBytes } from '../utils/formatBytes'
import { UPLOADS_PAUSED_MESSAGE } from '../messages'

type UploadState = 'idle' | 'selected' | 'uploading' | 'success' | 'error'

const props = withDefaults(
  defineProps<{ disabled?: boolean; disabledMessage?: string }>(),
  { disabled: false, disabledMessage: UPLOADS_PAUSED_MESSAGE },
)

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

const canInteract = computed(() => state.value !== 'uploading' && !props.disabled)

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

function browseClick() {
  fileInput.value?.click()
}

async function onUploadClick() {
  if (state.value === 'uploading' || props.disabled) return
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
    <p v-if="disabled" class="warning-panel" role="alert">
      <TriangleAlert :size="18" :stroke-width="2.2" />
      <span>{{ disabledMessage }}</span>
    </p>

    <div class="upload-card">
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
          class="visually-hidden"
          :disabled="!canInteract"
          @change="onFileInput"
        />
        <span class="dropzone-icon">
          <CloudUpload :size="26" :stroke-width="2" />
        </span>
        <span class="dropzone-primary">Drag &amp; drop your file here</span>
        <span class="dropzone-secondary">
          or
          <button
            type="button"
            class="dropzone-link"
            :disabled="!canInteract"
            @click.prevent="browseClick"
          >
            click to browse
          </button>
        </span>
      </label>

      <p class="helper">
        <Lock :size="14" :stroke-width="2.2" />
        Max file size: 100 MB. Files expire after 24 hours.
      </p>

      <div v-if="state === 'selected' && file" class="file-row">
        <span class="file-icon">
          <FileText :size="20" :stroke-width="2" />
        </span>
        <div class="file-meta">
          <p class="file-name" :title="file.name">{{ file.name }}</p>
          <p class="file-size">{{ formatBytes(file.size) }}</p>
        </div>
        <CheckCircle2 class="file-check" :size="20" :stroke-width="2.2" />
        <button
          type="button"
          class="file-remove-button"
          aria-label="Remove file"
          @click="reset"
        >
          <X :size="18" :stroke-width="2.2" />
        </button>
      </div>

      <button
        v-if="state === 'selected' || state === 'idle'"
        type="button"
        class="primary-button"
        :disabled="disabled || state === 'idle'"
        @click="onUploadClick"
      >
        <CloudUpload :size="18" :stroke-width="2.2" />
        Upload
      </button>

      <div v-if="state === 'uploading'" class="progress" aria-live="polite">
        <p class="progress-line">Upload progress: {{ progress }}%</p>
        <div class="progress-track">
          <div class="progress-bar" :style="{ width: `${progress}%` }" />
        </div>
      </div>

      <div v-if="state === 'error'" class="error-panel" role="alert">
        <p class="error-text">{{ error }}</p>
        <div class="error-actions">
          <button type="button" class="ghost-button" @click="tryAgain">Try again</button>
          <button type="button" class="ghost-button" @click="reset">Reset</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.uploader {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.warning-panel {
  margin: 0 auto;
  max-width: 620px;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 14px 16px;
  border-radius: 14px;
  border: 1px solid rgba(245, 158, 11, 0.32);
  background: var(--color-warning-soft);
  color: #fde68a;
  font-size: 0.95rem;
}

.upload-card {
  margin: 0 auto;
  max-width: 620px;
  width: 100%;
  padding: 18px;
  border-radius: var(--radius-lg);
  background: linear-gradient(180deg, rgba(22, 34, 53, 0.96), rgba(17, 28, 46, 0.96));
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-card);
}

@media (max-width: 720px) {
  .upload-card {
    padding: 14px;
    border-radius: 18px;
  }
}

.dropzone {
  min-height: 150px;
  border: 1.5px dashed var(--color-border-strong);
  border-radius: var(--radius);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 24px;
  color: var(--color-text-soft);
  background: rgba(7, 17, 31, 0.28);
  cursor: pointer;
  transition: border-color 160ms ease, background 160ms ease, transform 160ms ease;
}

.dropzone:hover,
.dropzone.is-dragging {
  border-color: rgba(59, 130, 246, 0.75);
  background: var(--color-primary-soft);
}

.dropzone.has-error {
  border-color: rgba(239, 68, 68, 0.55);
}

.dropzone.is-disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.visually-hidden {
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

.dropzone-icon {
  width: 52px;
  height: 52px;
  border-radius: var(--radius-pill);
  display: grid;
  place-items: center;
  background: rgba(148, 163, 184, 0.12);
  color: var(--color-text);
}

.dropzone-primary {
  font-weight: 600;
  color: var(--color-text);
  margin-top: 4px;
}

.dropzone-secondary {
  font-size: 0.9rem;
  color: var(--color-text-muted);
}

.dropzone-link {
  color: var(--color-primary);
  font-weight: 600;
  cursor: pointer;
  background: transparent;
  border: 0;
  padding: 0;
  margin-left: 4px;
}

.dropzone-link:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.helper {
  margin-top: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  color: var(--color-text-muted);
  font-size: 0.85rem;
}

.file-row {
  margin-top: 14px;
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.85rem;
  border-radius: 14px;
  background: rgba(7, 17, 31, 0.36);
  border: 1px solid var(--color-border);
}

.file-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-sm);
  background: var(--color-primary-soft);
  color: var(--color-primary);
  display: grid;
  place-items: center;
  flex: 0 0 auto;
}

.file-meta {
  min-width: 0;
  flex: 1;
}

.file-name {
  color: var(--color-text);
  font-weight: 650;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-size {
  margin-top: 0.2rem;
  color: var(--color-text-muted);
  font-size: 0.875rem;
}

.file-check {
  color: var(--color-success);
  flex: 0 0 auto;
}

.file-remove-button {
  color: var(--color-text-muted);
  border: 0;
  background: transparent;
  cursor: pointer;
  min-width: 36px;
  min-height: 36px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  transition: color 120ms ease, background-color 120ms ease;
}

.file-remove-button:hover {
  color: var(--color-text);
  background: rgba(148, 163, 184, 0.1);
}

.primary-button {
  width: 100%;
  margin-top: 14px;
  height: 48px;
  border: 0;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--color-primary), #2563eb);
  color: white;
  font-weight: 700;
  font-size: 1rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  cursor: pointer;
  transition: transform 150ms ease, filter 150ms ease, opacity 150ms ease;
}

.primary-button:hover:not(:disabled) {
  filter: brightness(1.08);
  transform: translateY(-1px);
}

.primary-button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.progress {
  margin-top: 14px;
}

.progress-line {
  color: var(--color-text-muted);
  font-size: 0.875rem;
  margin-bottom: 8px;
}

.progress-track {
  height: 8px;
  border-radius: var(--radius-pill);
  background: rgba(148, 163, 184, 0.14);
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--color-primary), var(--color-accent));
  transition: width 180ms ease;
}

.error-panel {
  margin-top: 14px;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid rgba(239, 68, 68, 0.36);
  background: var(--color-danger-soft);
  color: #fecaca;
  font-size: 0.9rem;
}

.error-text {
  margin: 0;
}

.error-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
  flex-wrap: wrap;
}

.ghost-button {
  padding: 0.35rem 0.85rem;
  border-radius: 8px;
  border: 1px solid rgba(254, 202, 202, 0.4);
  background: transparent;
  color: #fecaca;
  cursor: pointer;
  font-size: 0.85rem;
}

.ghost-button:hover {
  background: rgba(239, 68, 68, 0.18);
}
</style>
