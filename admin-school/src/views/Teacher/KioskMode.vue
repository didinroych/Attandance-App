<template>
  <admin-layout>
    <div class="mx-auto max-w-4xl space-y-6">
      <!-- Header -->
      <div class="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Classroom Attendance Kiosk</h1>
          <p class="mt-1 text-sm text-gray-500">
            Auto-verify student attendance using face recognition
          </p>
        </div>
      </div>

      <!-- Session Selection -->
      <div class="rounded-lg bg-white p-6 shadow">
        <label class="block text-sm font-medium text-gray-700">
          Select Session
        </label>
        <select
          v-model="selectedSession"
          @change="handleSessionChange"
          class="mt-2 block w-full rounded-md border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        >
          <option :value="null">-- Select a session --</option>
          <option
            v-for="session in sessions"
            :key="session.sessionId"
            :value="session.sessionId"
          >
            {{ session.subject }} - {{ session.className }} ({{ session.startTime }})
          </option>
        </select>
      </div>

      <!-- Camera Selection -->
      <div v-if="availableCameras.length > 0" class="rounded-lg bg-white p-6 shadow">
        <div class="flex items-center gap-2 mb-2">
          <svg class="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <label class="block text-sm font-medium text-gray-700">
            Select Camera
          </label>
        </div>
        <select
          v-model="selectedCameraId"
          @change="handleCameraChange"
          class="mt-2 block w-full rounded-md border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        >
          <option
            v-for="camera in availableCameras"
            :key="camera.deviceId"
            :value="camera.deviceId"
          >
            {{ camera.label }}
          </option>
        </select>
        <p class="mt-1 text-xs text-gray-500">
          {{ availableCameras.length }} camera(s) detected
        </p>
      </div>

      <!-- Mode Selection -->
      <div class="rounded-lg bg-white p-6 shadow">
        <label class="block text-sm font-medium text-gray-700 mb-3">
          Capture Mode
        </label>
        <div class="flex gap-4">
          <label class="flex items-center">
            <input
              v-model="mode"
              type="radio"
              value="auto"
              :disabled="isCapturing"
              class="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span class="ml-2 text-sm text-gray-700">Auto (Every 3 seconds)</span>
          </label>
          <label class="flex items-center">
            <input
              v-model="mode"
              type="radio"
              value="manual"
              :disabled="isCapturing"
              class="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span class="ml-2 text-sm text-gray-700">Manual</span>
          </label>
        </div>
      </div>

      <!-- Control Buttons -->
      <div class="rounded-lg bg-white p-6 shadow">
        <div class="flex gap-3">
          <!-- Start Auto Capture -->
          <button
            v-if="!isCapturing && mode === 'auto'"
            @click="startAutoCapture"
            class="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Start Auto Capture
          </button>

          <!-- Start Camera (Manual Mode) -->
          <button
            v-if="!isCapturing && mode === 'manual'"
            @click="startManualMode"
            class="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Start Camera
          </button>

          <!-- Stop Button -->
          <button
            v-if="isCapturing"
            @click="stopCapture"
            class="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700"
          >
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
            </svg>
            Stop
          </button>

          <!-- Manual Capture Button -->
          <button
            v-if="mode === 'manual' && isActive"
            @click="handleManualCapture"
            class="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-700"
          >
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Capture Now
          </button>
        </div>
      </div>

      <!-- Video Feed -->
      <div class="rounded-lg bg-white p-6 shadow">
        <div class="relative">
          <video
            ref="videoRef"
            autoplay
            class="w-full max-w-2xl mx-auto rounded-lg border-2 border-gray-300 bg-black"
          />
          <canvas ref="canvasRef" class="hidden" />
        </div>
      </div>

      <!-- Status Display -->
      <div
        :class="[
          'rounded-lg p-4 text-center text-lg font-semibold',
          statusClass
        ]"
      >
        {{ status }}
      </div>

      <!-- Recent Attendance -->
      <div class="rounded-lg bg-white p-6 shadow">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Recent Attendance</h3>
        <div v-if="recentAttendance.length === 0" class="text-center text-gray-500 py-8">
          No attendance marked yet...
        </div>
        <ul v-else class="space-y-2">
          <li
            v-for="att in recentAttendance"
            :key="att.id"
            class="flex items-center justify-between rounded-lg border-l-4 border-green-500 bg-green-50 p-4"
          >
            <div class="flex items-center gap-3">
              <svg class="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <span class="font-semibold text-gray-900">{{ att.name }}</span>
            </div>
            <div class="flex items-center gap-4 text-sm text-gray-600">
              <span>{{ att.time }}</span>
              <span class="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                {{ (att.confidence * 100).toFixed(0) }}% confidence
              </span>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </admin-layout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import { useCamera } from '@/composables/useCamera'
import { useTeacherSessions } from '@/composables/useTeacherSessions'

// Composables
const {
  videoRef,
  canvasRef,
  isActive,
  availableCameras,
  selectedCameraId,
  enumerateCameras,
  startCamera,
  stopCamera,
  switchCamera,
  captureFrame
} = useCamera()

const {
  sessions,
  selectedSession,
  recentAttendance,
  fetchOngoingSessions,
  verifyAndMarkAttendance,
  setSelectedSession
} = useTeacherSessions()

// Local state
const mode = ref<'auto' | 'manual'>('auto')
const isCapturing = ref(false)
const status = ref('Select a session to begin')
const captureInterval = ref<number | null>(null)

// Status styling
const statusClass = computed(() => {
  if (status.value.includes('✅')) {
    return 'bg-green-50 text-green-800 border border-green-200'
  } else if (status.value.includes('❌')) {
    return 'bg-red-50 text-red-800 border border-red-200'
  } else if (status.value.includes('🟢')) {
    return 'bg-blue-50 text-blue-800 border border-blue-200'
  } else {
    return 'bg-gray-50 text-gray-800 border border-gray-200'
  }
})

// Lifecycle
onMounted(async () => {
  await Promise.all([
    fetchOngoingSessions(),
    enumerateCameras()
  ])
})

// Methods
const handleSessionChange = () => {
  setSelectedSession(selectedSession.value)
}

const handleCameraChange = async () => {
  if (isActive.value && selectedCameraId.value) {
    // Switch camera if already active
    const switched = await switchCamera(selectedCameraId.value)
    if (!switched) {
      status.value = '❌ Failed to switch camera'
    }
  }
}

const startAutoCapture = async () => {
  if (!selectedSession.value) {
    alert('Please select a session first')
    return
  }

  isCapturing.value = true
  const cameraStarted = await startCamera()

  if (cameraStarted) {
    status.value = '🟢 Camera ready - Waiting for students...'

    // Start capturing every 3 seconds
    captureInterval.value = window.setInterval(async () => {
      const imageBlob = await captureFrame()
      if (imageBlob) {
        await processCapture(imageBlob, false)
      }
    }, 3000)
  } else {
    isCapturing.value = false
    status.value = '❌ Cannot access camera. Please check permissions.'
  }
}

const startManualMode = async () => {
  const cameraStarted = await startCamera()
  if (cameraStarted) {
    status.value = '🟢 Camera ready - Click "Capture Now" to verify'
  } else {
    status.value = '❌ Cannot access camera. Please check permissions.'
  }
}

const stopCapture = () => {
  isCapturing.value = false

  if (captureInterval.value) {
    clearInterval(captureInterval.value)
    captureInterval.value = null
  }

  stopCamera()
  status.value = 'Camera stopped'
}

const handleManualCapture = async () => {
  if (!selectedSession.value) {
    alert('Please select a session first')
    return
  }

  const imageBlob = await captureFrame()
  if (imageBlob) {
    await processCapture(imageBlob, true)
  }
}

const processCapture = async (imageBlob: Blob, showErrors: boolean) => {
  console.log('🎬 [processCapture] Called')
  console.log('   Mode:', showErrors ? 'Manual (show errors)' : 'Auto (silent on error)')
  console.log('   Image blob:', imageBlob)

  const result = await verifyAndMarkAttendance(imageBlob)

  console.log('📥 [processCapture] Result received:', result)

  if (result) {
    if (result.success && result.student) {
      // Success
      console.log('✅ [processCapture] SUCCESS! Student verified:', result.student.fullName)
      console.log('   Confidence:', result.confidence)
      console.log('   Attendance:', result.attendance)

      status.value = `✅ ${result.student.fullName} - Attendance Marked`
      playSuccessSound()

      // Reset status after 2 seconds
      setTimeout(() => {
        status.value = '🟢 Waiting for students...'
      }, 2000)
    } else {
      // Face not recognized
      console.log('❌ [processCapture] FAILED:', result.message)
      console.log('   Verified:', result.verified)
      console.log('   Confidence:', result.confidence)

      if (showErrors) {
        status.value = `❌ ${result.message}`
        setTimeout(() => {
          status.value = '🟢 Ready to capture'
        }, 2000)
      }
      // In auto mode, silently continue
    }
  } else if (showErrors) {
    // Network error
    console.error('🔥 [processCapture] NULL RESULT - Network error!')
    status.value = '❌ Network error. Please try again.'
    setTimeout(() => {
      status.value = '🟢 Ready to capture'
    }, 2000)
  }
}

const playSuccessSound = () => {
  try {
    const audio = new Audio('/sounds/success.mp3')
    audio.play().catch(err => console.log('Audio play failed:', err))
  } catch (err) {
    console.log('Audio not available:', err)
  }
}
</script>
