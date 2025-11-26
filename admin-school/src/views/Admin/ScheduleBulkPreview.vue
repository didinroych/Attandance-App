<template>
  <admin-layout>
    <div class="mx-auto max-w-7xl space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            Bulk Upload Preview
          </h1>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Review the schedules below before submitting
          </p>
        </div>
      </div>

      <!-- Summary -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div class="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
          <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
            Total Schedules
          </dt>
          <dd class="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">
            {{ previewData.length }}
          </dd>
        </div>
        <div class="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
          <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
            Valid
          </dt>
          <dd class="mt-1 text-3xl font-semibold text-green-600 dark:text-green-400">
            {{ validCount }}
          </dd>
        </div>
        <div class="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
          <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
            Invalid
          </dt>
          <dd class="mt-1 text-3xl font-semibold text-red-600 dark:text-red-400">
            {{ invalidCount }}
          </dd>
        </div>
      </div>

      <!-- Error message -->
      <div
        v-if="error"
        class="rounded-md bg-red-50 p-4 dark:bg-red-900/20"
      >
        <p class="text-sm text-red-800 dark:text-red-200">{{ error }}</p>
      </div>

      <!-- Preview Table -->
      <div class="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                  Status
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                  Class
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                  Subject
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                  Teacher
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                  Day
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                  Time
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                  Room
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                  Academic Period
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
              <tr
                v-for="(item, index) in previewData"
                :key="index"
                :class="{ 'bg-red-50 dark:bg-red-900/10': !item.isValid }"
              >
                <td class="whitespace-nowrap px-6 py-4 text-sm">
                  <span
                    v-if="item.isValid"
                    class="inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold leading-5 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                  >
                    Valid
                  </span>
                  <span
                    v-else
                    class="inline-flex rounded-full bg-red-100 px-2 text-xs font-semibold leading-5 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                    :title="item.errors?.join(', ')"
                  >
                    Invalid
                  </span>
                </td>
                <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-gray-300">
                  {{ item.className || item.classId }}
                </td>
                <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-gray-300">
                  {{ item.subjectName || item.subjectId }}
                </td>
                <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-gray-300">
                  {{ item.teacherName || item.teacherId }}
                </td>
                <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-gray-300">
                  {{ item.dayName || getDayName(item.dayOfWeek) }}
                </td>
                <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-gray-300">
                  {{ formatTime(item.startTime) }} - {{ formatTime(item.endTime) }}
                </td>
                <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-gray-300">
                  {{ item.room }}
                </td>
                <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-gray-300">
                  {{ item.academicPeriodName || item.academicPeriodId }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Error details -->
      <div v-if="invalidCount > 0" class="rounded-lg bg-yellow-50 p-4 dark:bg-yellow-900/20">
        <h3 class="text-sm font-medium text-yellow-800 dark:text-yellow-200">
          Validation Errors
        </h3>
        <ul class="mt-2 list-inside list-disc space-y-1 text-sm text-yellow-700 dark:text-yellow-300">
          <li v-for="(item, index) in invalidItems" :key="index">
            Row {{ index + 1 }}: {{ item.errors?.join(', ') }}
          </li>
        </ul>
      </div>

      <!-- Actions -->
      <div class="flex justify-end gap-3">
        <button
          @click="handleCancel"
          type="button"
          class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          Cancel
        </button>
        <button
          @click="handleSubmit"
          :disabled="validCount === 0 || submitting"
          type="button"
          class="rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          {{ submitting ? 'Submitting...' : `Submit ${validCount} Valid Schedules` }}
        </button>
      </div>
    </div>
  </admin-layout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import { useScheduleManagement } from '@/composables/useScheduleManagement'
import type { ScheduleBulkItem } from '@/types/schedule'
import { DAYS_OF_WEEK } from '@/types/schedule'

const router = useRouter()
const route = useRoute()
const { bulkCreateSchedules } = useScheduleManagement()

const previewData = ref<ScheduleBulkItem[]>([])
const submitting = ref(false)
const error = ref<string | null>(null)

const validCount = computed(() => previewData.value.filter((item) => item.isValid).length)
const invalidCount = computed(() => previewData.value.filter((item) => !item.isValid).length)
const invalidItems = computed(() => previewData.value.filter((item) => !item.isValid))

const getDayName = (dayOfWeek: number): string => {
  const day = DAYS_OF_WEEK.find((d) => d.value === dayOfWeek)
  return day ? day.label : 'Unknown'
}

const formatTime = (time: string): string => {
  if (!time) return ''
  // If time is in HH:mm:ss format, return HH:mm
  const parts = time.split(':')
  return `${parts[0]}:${parts[1]}`
}

const handleCancel = () => {
  router.push('/schedule/class-schedule')
}

const handleSubmit = async () => {
  const validSchedules = previewData.value.filter((item) => item.isValid)

  if (validSchedules.length === 0) {
    error.value = 'No valid schedules to submit'
    return
  }

  submitting.value = true
  error.value = null

  // Remove display-only fields before submission
  const schedulesToSubmit = validSchedules.map((item) => ({
    classId: item.classId,
    subjectId: item.subjectId,
    teacherId: item.teacherId,
    academicPeriodId: item.academicPeriodId,
    dayOfWeek: item.dayOfWeek,
    startTime: item.startTime,
    endTime: item.endTime,
    room: item.room
  }))

  const success = await bulkCreateSchedules(schedulesToSubmit)

  if (success) {
    router.push({
      path: '/schedule/class-schedule',
      query: { success: 'Schedules uploaded successfully' }
    })
  } else {
    error.value = 'Failed to create schedules. Please check for conflicts or invalid data.'
  }

  submitting.value = false
}

onMounted(() => {
  // Get preview data from route state
  const state = history.state as { previewData?: ScheduleBulkItem[] }
  if (state && state.previewData) {
    previewData.value = state.previewData
  } else {
    // If no data, redirect back
    router.push('/schedule/class-schedule')
  }
})
</script>
