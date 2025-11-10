<template>
  <div class="space-y-4">
    <!-- Dropzone Area -->
    <div
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="handleDrop"
      :class="[
        'relative rounded-lg border-2 border-dashed p-8 text-center transition-colors',
        isDragging
          ? 'border-blue-500 bg-blue-50'
          : error
          ? 'border-red-300 bg-red-50'
          : 'border-gray-300 bg-gray-50 hover:border-gray-400'
      ]"
    >
      <input
        ref="fileInput"
        type="file"
        accept=".csv"
        @change="handleFileSelect"
        class="hidden"
      />

      <div class="flex flex-col items-center">
        <!-- Icon -->
        <svg
          :class="[
            'mx-auto h-12 w-12',
            error ? 'text-red-400' : isDragging ? 'text-blue-500' : 'text-gray-400'
          ]"
          stroke="currentColor"
          fill="none"
          viewBox="0 0 48 48"
        >
          <path
            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>

        <!-- Text -->
        <div class="mt-4">
          <button
            @click="openFileDialog"
            type="button"
            class="text-sm font-semibold text-blue-600 hover:text-blue-500 focus:outline-none focus:underline"
          >
            Upload a CSV file
          </button>
          <p class="mt-1 text-xs text-gray-500">or drag and drop</p>
        </div>

        <p class="mt-2 text-xs text-gray-500">CSV files only, up to {{ maxSizeMB }}MB</p>

        <!-- Error Message -->
        <p v-if="error" class="mt-2 text-sm text-red-600">{{ error }}</p>

        <!-- File Info -->
        <div v-if="file && !error" class="mt-4 flex items-center gap-2 rounded-md bg-white px-4 py-2 text-sm">
          <svg class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <span class="flex-1 truncate text-gray-700">{{ file.name }}</span>
          <span class="text-gray-500">({{ formatFileSize(file.size) }})</span>
          <button
            @click="removeFile"
            type="button"
            class="ml-2 text-red-600 hover:text-red-700"
          >
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Instructions -->
    <div v-if="showInstructions" class="rounded-md bg-blue-50 p-4">
      <div class="flex">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
            <path
              fill-rule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clip-rule="evenodd"
            />
          </svg>
        </div>
        <div class="ml-3 flex-1">
          <h3 class="text-sm font-medium text-blue-800">CSV Format Instructions</h3>
          <div class="mt-2 text-sm text-blue-700">
            <slot name="instructions">
              <p>Please ensure your CSV file follows the required format with all necessary columns.</p>
            </slot>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  maxSizeMB?: number
  showInstructions?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  maxSizeMB: 5,
  showInstructions: true
})

const emit = defineEmits<{
  'file-selected': [file: File]
  'file-removed': []
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const file = ref<File | null>(null)
const isDragging = ref(false)
const error = ref<string>('')

const openFileDialog = () => {
  fileInput.value?.click()
}

const validateFile = (selectedFile: File): boolean => {
  error.value = ''

  // Check file type
  if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
    error.value = 'Please upload a CSV file'
    return false
  }

  // Check file size
  const maxSizeBytes = props.maxSizeMB * 1024 * 1024
  if (selectedFile.size > maxSizeBytes) {
    error.value = `File size must not exceed ${props.maxSizeMB}MB`
    return false
  }

  return true
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const selectedFile = target.files?.[0]

  if (selectedFile && validateFile(selectedFile)) {
    file.value = selectedFile
    emit('file-selected', selectedFile)
  }

  // Reset input
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const handleDrop = (event: DragEvent) => {
  isDragging.value = false
  const droppedFile = event.dataTransfer?.files[0]

  if (droppedFile && validateFile(droppedFile)) {
    file.value = droppedFile
    emit('file-selected', droppedFile)
  }
}

const removeFile = () => {
  file.value = null
  error.value = ''
  emit('file-removed')
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

defineExpose({
  removeFile
})
</script>
