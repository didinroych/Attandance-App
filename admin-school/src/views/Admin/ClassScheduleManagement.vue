<template>
  <admin-layout>
    <div class="mx-auto max-w-7xl">
      <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 class="text-title-md2 font-bold text-gray-900 dark:text-white">
          Class Schedule Management
        </h2>
        <div class="flex gap-3">
          <button
            @click="openCsvUploadModal"
            type="button"
            class="inline-flex items-center gap-2.5 rounded-md border border-blue-600 bg-transparent px-4 py-2.5 text-center font-medium text-blue-600 hover:bg-blue-50 dark:border-blue-500 dark:text-blue-400 dark:hover:bg-blue-900/20"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Bulk Upload CSV
          </button>
          <button
            @click="openCreateModal"
            type="button"
            class="inline-flex items-center gap-2.5 rounded-md bg-blue-600 px-4 py-2.5 text-center font-medium text-white hover:bg-opacity-90"
          >
            <svg class="fill-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 4V16M16 10H4" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            </svg>
            Add Schedule
          </button>
        </div>
      </div>

      <!-- Success Display -->
      <div v-if="successMessage" class="mb-4 rounded-md bg-green-50 p-4 dark:bg-green-900/20">
        <p class="text-sm text-green-800 dark:text-green-200">{{ successMessage }}</p>
      </div>

      <!-- Error Display -->
      <div v-if="error" class="mb-4 rounded-md bg-red-50 p-4 dark:bg-red-900/20">
        <p class="text-sm text-red-800 dark:text-red-200">{{ error }}</p>
      </div>

      <!-- Search and Filters -->
      <div class="mb-4 space-y-3">
        <!-- Search Bar -->
        <div class="flex gap-3">
          <div class="flex-1">
            <input
              v-model="searchInput"
              @input="debouncedSearch"
              type="text"
              placeholder="Search by class, subject, teacher, or room..."
              class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>
          <button
            v-if="searchInput"
            @click="clearSearch"
            type="button"
            class="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Clear
          </button>
        </div>
      </div>

      <!-- Data Table -->
      <div class="rounded-sm border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <data-table
          :columns="columns"
          :data="schedules"
          :loading="loading"
          :pagination="pagination"
          :sort-by="sortBy"
          :sort-order="sortOrder"
          :has-actions="true"
          :initial-limit="20"
          empty-message="No schedules found"
          @sort-change="handleSortChange"
          @page-change="handlePageChange"
          @limit-change="handleLimitChange"
        >
          <template #cell-dayName="{ row }">
            <span class="font-medium text-gray-900 dark:text-gray-100">
              {{ row.dayName }}
            </span>
          </template>
          <template #cell-time="{ row }">
            <span class="text-sm text-gray-700 dark:text-gray-300">
              {{ formatTime(row.startTime) }} - {{ formatTime(row.endTime) }}
            </span>
          </template>
          <template #cell-isActive="{ row }">
            <span
              v-if="row.isActive"
              class="inline-flex rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-200"
            >
              Active
            </span>
            <span
              v-else
              class="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-900/30 dark:text-gray-200"
            >
              Inactive
            </span>
          </template>
          <template #actions="{ row }">
            <div class="flex items-center gap-2">
              <button
                @click="openDetailsModal(row)"
                class="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                title="View Details"
              >
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
              <button
                @click="openEditModal(row)"
                class="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                title="Edit"
              >
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                @click="openDeleteConfirm(row)"
                class="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                title="Delete"
              >
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </template>
        </data-table>
      </div>

      <!-- Create/Edit Modal -->
      <modal v-model="showFormModal" :title="isEditMode ? 'Edit Schedule' : 'Add New Schedule'" size="lg">
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="mb-2.5 block text-gray-900 dark:text-white">
                Class <span class="text-red-500">*</span>
              </label>
              <select
                v-model="formData.classId"
                required
                class="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                <option :value="0">Select class</option>
                <option v-for="cls in classes" :key="cls.id" :value="cls.id">
                  {{ cls.name }}
                </option>
              </select>
            </div>

            <div>
              <label class="mb-2.5 block text-gray-900 dark:text-white">
                Subject <span class="text-red-500">*</span>
              </label>
              <select
                v-model="formData.subjectId"
                required
                class="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                <option :value="0">Select subject</option>
                <option v-for="subject in subjects" :key="subject.id" :value="subject.id">
                  {{ subject.name }}
                </option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="mb-2.5 block text-gray-900 dark:text-white">
                Teacher <span class="text-red-500">*</span>
              </label>
              <select
                v-model="formData.teacherId"
                required
                class="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                <option :value="0">Select teacher</option>
                <option v-for="teacher in teachers" :key="teacher.id" :value="teacher.id">
                  {{ teacher.fullName }}
                </option>
              </select>
            </div>

            <div>
              <label class="mb-2.5 block text-gray-900 dark:text-white">
                Academic Period <span class="text-red-500">*</span>
              </label>
              <select
                v-model="formData.academicPeriodId"
                required
                class="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                <option :value="0">Select period</option>
                <option v-for="period in academicPeriods" :key="period.id" :value="period.id">
                  {{ period.name }}
                </option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-4">
            <div>
              <label class="mb-2.5 block text-gray-900 dark:text-white">
                Day of Week <span class="text-red-500">*</span>
              </label>
              <select
                v-model.number="formData.dayOfWeek"
                required
                class="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                <option :value="0">Select day</option>
                <option v-for="day in daysOfWeek" :key="day.value" :value="day.value">
                  {{ day.label }}
                </option>
              </select>
            </div>

            <div>
              <label class="mb-2.5 block text-gray-900 dark:text-white">
                Start Time <span class="text-red-500">*</span>
              </label>
              <input
                v-model="formData.startTime"
                type="time"
                required
                class="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div>
              <label class="mb-2.5 block text-gray-900 dark:text-white">
                End Time <span class="text-red-500">*</span>
              </label>
              <input
                v-model="formData.endTime"
                type="time"
                required
                class="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label class="mb-2.5 block text-gray-900 dark:text-white">
              Room <span class="text-red-500">*</span>
            </label>
            <input
              v-model="formData.room"
              type="text"
              required
              class="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              placeholder="e.g., Lab 1, Room 201"
            />
          </div>
        </form>
        <template #footer>
          <div class="flex gap-3">
            <button
              @click="handleSubmit"
              :disabled="submitting || !isFormValid"
              type="button"
              class="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {{ submitting ? 'Saving...' : (isEditMode ? 'Update' : 'Create') }}
            </button>
            <button
              @click="showFormModal = false"
              type="button"
              class="rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-white dark:ring-gray-700 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </template>
      </modal>

      <!-- Details Modal -->
      <modal v-model="showDetailsModal" title="Schedule Details" size="lg">
        <div v-if="selectedSchedule" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-500 dark:text-gray-400">Class</label>
              <p class="mt-1 text-gray-900 dark:text-white">{{ selectedSchedule.class.name }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-500 dark:text-gray-400">Subject</label>
              <p class="mt-1 text-gray-900 dark:text-white">{{ selectedSchedule.subject.name }}</p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-500 dark:text-gray-400">Teacher</label>
              <p class="mt-1 text-gray-900 dark:text-white">{{ selectedSchedule.teacher.fullName }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-500 dark:text-gray-400">Academic Period</label>
              <p class="mt-1 text-gray-900 dark:text-white">{{ selectedSchedule.academicPeriod.name }}</p>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-500 dark:text-gray-400">Day</label>
              <p class="mt-1 text-gray-900 dark:text-white">{{ selectedSchedule.dayName }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-500 dark:text-gray-400">Time</label>
              <p class="mt-1 text-gray-900 dark:text-white">
                {{ formatTime(selectedSchedule.startTime) }} - {{ formatTime(selectedSchedule.endTime) }}
              </p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-500 dark:text-gray-400">Room</label>
              <p class="mt-1 text-gray-900 dark:text-white">{{ selectedSchedule.room }}</p>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-500 dark:text-gray-400">Status</label>
            <p class="mt-1">
              <span
                v-if="selectedSchedule.isActive"
                class="inline-flex rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-200"
              >
                Active
              </span>
              <span
                v-else
                class="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-900/30 dark:text-gray-200"
              >
                Inactive
              </span>
            </p>
          </div>
        </div>
        <template #footer>
          <button
            @click="showDetailsModal = false"
            type="button"
            class="rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-white dark:ring-gray-700 dark:hover:bg-gray-700"
          >
            Close
          </button>
        </template>
      </modal>

      <!-- CSV Upload Modal -->
      <modal v-model="showCsvUploadModal" title="Bulk Upload Schedules" size="lg">
        <div class="space-y-4">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Upload a CSV file to create multiple schedules at once. The CSV should have the following columns:
          </p>
          <div class="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
            <code class="text-sm text-gray-800 dark:text-gray-200">
              classId, subjectId, teacherId, academicPeriodId, dayOfWeek, startTime, endTime, room
            </code>
          </div>

          <!-- File Upload -->
          <div class="space-y-3">
            <input
              ref="csvFileInput"
              type="file"
              accept=".csv"
              @change="handleCsvFileSelected"
              class="hidden"
            />
            <button
              @click="csvFileInput?.click()"
              type="button"
              class="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Choose CSV File
            </button>
            <div v-if="csvFile" class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <svg class="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{{ csvFile.name }}</span>
              <button
                @click="csvFile = null; if (csvFileInput) csvFileInput.value = ''"
                type="button"
                class="text-red-600 hover:text-red-700"
              >
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Error Display -->
          <div v-if="csvError" class="mt-4 rounded-md bg-red-50 p-4 dark:bg-red-900/20">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="ml-3 flex-1">
                <h3 class="text-sm font-medium text-red-800 dark:text-red-200">
                  {{ csvError }}
                </h3>
                <div v-if="csvValidationErrors.length > 0" class="mt-2 text-sm text-red-700 dark:text-red-300">
                  <div class="max-h-60 overflow-y-auto">
                    <ul class="list-inside list-disc space-y-1">
                      <li v-for="(error, index) in csvValidationErrors" :key="index" class="text-xs">
                        {{ error }}
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <template #footer>
          <div class="flex gap-3">
            <button
              @click="processCsvFile"
              :disabled="!csvFile || processingCsv"
              type="button"
              class="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {{ processingCsv ? 'Processing...' : 'Preview' }}
            </button>
            <button
              @click="showCsvUploadModal = false"
              type="button"
              class="rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-white dark:ring-gray-700 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </template>
      </modal>

      <!-- Delete Confirmation -->
      <confirm-dialog
        v-model="showDeleteConfirm"
        title="Delete Schedule"
        :message="deleteDialogMessage"
        type="danger"
        confirm-text="Delete"
        :loading="deleting"
        @confirm="confirmDelete"
      />
    </div>
  </admin-layout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useScheduleManagement } from '@/composables/useScheduleManagement'
import classService from '@/services/class.service'
import subjectService from '@/services/subject.service'
import userManagementService from '@/services/userManagement.service'
import academicPeriodService from '@/services/academicPeriod.service'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import DataTable from '@/components/common/DataTable.vue'
import Modal from '@/components/common/Modal.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import type { Schedule, ScheduleFormData, DAYS_OF_WEEK } from '@/types/schedule'
import type { Class } from '@/types/class'
import type { Subject } from '@/types/subject'
import type { Teacher } from '@/types/user'
import type { AcademicPeriod } from '@/types/academicPeriod'
import type { TableColumn } from '@/components/common/DataTable.vue'

const router = useRouter()
const route = useRoute()
const successMessage = ref<string | null>(null)

// Check for success message from route query
if (route.query.success) {
  successMessage.value = route.query.success as string
  // Remove query param
  router.replace({ query: {} })
}

// Auto-dismiss success message
const showSuccessMessage = (message: string) => {
  successMessage.value = message
  setTimeout(() => {
    successMessage.value = null
  }, 5000)
}

const {
  schedules,
  loading,
  error,
  pagination,
  sortBy,
  sortOrder,
  hasActiveFilters,
  fetchSchedules,
  handlePageChange,
  handleSortChange,
  handleSearch,
  clearSearch: clearSearchQuery,
  applyFilters: applyScheduleFilters,
  clearFilters: clearScheduleFilters,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getScheduleById
} = useScheduleManagement()

// Table columns
const columns: TableColumn[] = [
  { key: 'class.name', label: 'Class', sortable: true },
  { key: 'subject.name', label: 'Subject', sortable: true },
  { key: 'teacher.fullName', label: 'Teacher', sortable: true },
  { key: 'dayName', label: 'Day', sortable: false },
  { key: 'time', label: 'Time', sortable: false },
  { key: 'room', label: 'Room', sortable: false },
  { key: 'academicPeriod.name', label: 'Period', sortable: false, nowrap: false }
]

// Days of week
const daysOfWeek = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 7, label: 'Sunday' }
]

// Dropdown data
const classes = ref<Class[]>([])
const subjects = ref<Subject[]>([])
const teachers = ref<Teacher[]>([])
const academicPeriods = ref<AcademicPeriod[]>([])

// Load dropdown data
const loadDropdownData = async () => {
  try {
    const [classesRes, subjectsRes, teachersRes, periodsRes] = await Promise.all([
      classService.getClasses({ limit: 100, sortBy: 'name', sortOrder: 'asc' }),
      subjectService.getSubjects({ limit: 100, sortBy: 'name', sortOrder: 'asc' }),
      userManagementService.getUsers<Teacher>({ role: 'teacher', limit: 100, sortBy: 'name', sortOrder: 'asc' }),
      academicPeriodService.getAcademicPeriods({ limit: 100, sortBy: 'startDate', sortOrder: 'desc' })
    ])

    classes.value = classesRes.classes
    subjects.value = subjectsRes.subjects
    teachers.value = teachersRes.users
    academicPeriods.value = periodsRes.academicPeriods
  } catch (err) {
    console.error('Failed to load dropdown data:', err)
  }
}

// Search
const searchInput = ref('')
let searchTimeout: ReturnType<typeof setTimeout>

const debouncedSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    handleSearch(searchInput.value)
  }, 500)
}

const clearSearch = () => {
  searchInput.value = ''
  clearSearchQuery()
}

// Filters
const filters = ref<{
  classId?: number
  subjectId?: number
  teacherId?: number
  academicPeriodId?: number
}>({})

const applyFilters = () => {
  applyScheduleFilters(filters.value)
}

const clearFiltersHandler = () => {
  filters.value = {}
  clearScheduleFilters()
}

// Pagination limit handler
const handleLimitChange = (newLimit: number) => {
  pagination.value.limit = newLimit
  pagination.value.currentPage = 1
  fetchSchedules()
}

// Form Modal
const showFormModal = ref(false)
const isEditMode = ref(false)
const submitting = ref(false)
const editingScheduleId = ref<number | null>(null)
const formData = ref<ScheduleFormData>({
  classId: 0,
  subjectId: 0,
  teacherId: 0,
  academicPeriodId: 0,
  dayOfWeek: 0,
  startTime: '',
  endTime: '',
  room: ''
})

const isFormValid = computed(() => {
  return (
    formData.value.classId > 0 &&
    formData.value.subjectId > 0 &&
    formData.value.teacherId > 0 &&
    formData.value.academicPeriodId > 0 &&
    formData.value.dayOfWeek > 0 &&
    formData.value.startTime.trim() !== '' &&
    formData.value.endTime.trim() !== '' &&
    formData.value.room.trim() !== ''
  )
})

const openCreateModal = async () => {
  // Ensure dropdown data is loaded
  if (classes.value.length === 0 || subjects.value.length === 0 ||
      teachers.value.length === 0 || academicPeriods.value.length === 0) {
    await loadDropdownData()
  }

  isEditMode.value = false
  editingScheduleId.value = null
  formData.value = {
    classId: 0,
    subjectId: 0,
    teacherId: 0,
    academicPeriodId: 0,
    dayOfWeek: 0,
    startTime: '',
    endTime: '',
    room: ''
  }
  showFormModal.value = true
}

const openEditModal = async (schedule: Schedule) => {
  // Ensure dropdown data is loaded
  if (classes.value.length === 0 || subjects.value.length === 0 ||
      teachers.value.length === 0 || academicPeriods.value.length === 0) {
    await loadDropdownData()
  }

  isEditMode.value = true
  editingScheduleId.value = schedule.id

  console.log('Editing schedule:', schedule)
  console.log('Teacher data:', {
    scheduleTeacherId: schedule.teacher.id,
    scheduleTeacherName: schedule.teacher.fullName,
    availableTeachers: teachers.value.map(t => ({ id: t.id, name: t.fullName }))
  })

  formData.value = {
    classId: schedule.class.id,
    subjectId: schedule.subject.id,
    teacherId: schedule.teacher.id,
    academicPeriodId: schedule.academicPeriod.id,
    dayOfWeek: schedule.dayOfWeek,
    startTime: formatTimeForInput(schedule.startTime),
    endTime: formatTimeForInput(schedule.endTime),
    room: schedule.room
  }

  console.log('Form data set to:', formData.value)
  showFormModal.value = true
}

const handleSubmit = async () => {
  if (!isFormValid.value) return

  submitting.value = true
  let success = false

  // Format times to HH:mm:ss format (backend expects seconds)
  const dataToSubmit = {
    ...formData.value,
    startTime: `${formData.value.startTime}:00`,
    endTime: `${formData.value.endTime}:00`
  }

  if (isEditMode.value && editingScheduleId.value) {
    success = await updateSchedule(editingScheduleId.value, dataToSubmit)
    if (success) {
      showSuccessMessage('Schedule updated successfully!')
    }
  } else {
    success = await createSchedule(dataToSubmit)
    if (success) {
      showSuccessMessage('Schedule created successfully!')
    }
  }

  submitting.value = false

  if (success) {
    showFormModal.value = false
  }
}

// Details Modal
const showDetailsModal = ref(false)
const selectedSchedule = ref<Schedule | null>(null)

const openDetailsModal = (schedule: Schedule) => {
  selectedSchedule.value = schedule
  showDetailsModal.value = true
}

// Delete
const showDeleteConfirm = ref(false)
const deleting = ref(false)
const scheduleToDelete = ref<Schedule | null>(null)

const deleteDialogMessage = computed(() => {
  if (!scheduleToDelete.value) return ''
  return `Are you sure you want to delete this schedule for ${scheduleToDelete.value.class.name} - ${scheduleToDelete.value.subject.name}? This action cannot be undone.`
})

const openDeleteConfirm = (schedule: Schedule) => {
  scheduleToDelete.value = schedule
  showDeleteConfirm.value = true
}

const confirmDelete = async () => {
  if (!scheduleToDelete.value) return

  deleting.value = true
  const success = await deleteSchedule(scheduleToDelete.value.id, true)
  deleting.value = false

  showDeleteConfirm.value = false
  scheduleToDelete.value = null

  if (success) {
    showSuccessMessage('Schedule deleted successfully!')
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

// CSV Upload
const showCsvUploadModal = ref(false)
const csvFileInput = ref<HTMLInputElement | null>(null)
const csvFile = ref<File | null>(null)
const processingCsv = ref(false)
const csvError = ref<string | null>(null)
const csvValidationErrors = ref<string[]>([])

const openCsvUploadModal = () => {
  csvFile.value = null
  csvError.value = null
  csvValidationErrors.value = []
  showCsvUploadModal.value = true
}

const handleCsvFileSelected = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) {
    csvFile.value = file
    csvError.value = null
    csvValidationErrors.value = []
  }
}

const processCsvFile = async () => {
  if (!csvFile.value) return

  processingCsv.value = true
  csvError.value = null
  csvValidationErrors.value = []

  try {
    // Ensure dropdown data is loaded
    if (classes.value.length === 0 || subjects.value.length === 0 ||
        teachers.value.length === 0 || academicPeriods.value.length === 0) {
      await loadDropdownData()
    }

    // Parse CSV file
    const text = await csvFile.value.text()
    const lines = text.split('\n').filter(line => line.trim())

    if (lines.length === 0) {
      csvError.value = 'CSV file is empty'
      processingCsv.value = false
      return
    }

    const headers = lines[0].split(',').map(h => h.trim())

    // Validate headers
    const requiredHeaders = ['classId', 'subjectId', 'teacherId', 'academicPeriodId', 'dayOfWeek', 'startTime', 'endTime', 'room']
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h))

    if (missingHeaders.length > 0) {
      csvError.value = `Missing required columns: ${missingHeaders.join(', ')}`
      csvValidationErrors.value = [
        'Required CSV format:',
        'classId, subjectId, teacherId, academicPeriodId, dayOfWeek, startTime, endTime, room',
        '',
        `Missing: ${missingHeaders.join(', ')}`
      ]
      processingCsv.value = false
      return
    }

    if (lines.length === 1) {
      csvError.value = 'CSV file has no data rows'
      processingCsv.value = false
      return
    }

    // Parse data rows with detailed validation
    const validationErrors: string[] = []
    const previewData = lines.slice(1).map((line, index) => {
      const rowNumber = index + 2 // +2 because: +1 for header, +1 for 1-based indexing
      const values = line.split(',').map(v => v.trim())
      const row: any = {}
      headers.forEach((header, index) => {
        row[header] = values[index]
      })

      // Detailed validation
      const errors: string[] = []

      // Validate classId
      if (!row.classId || row.classId === '') {
        errors.push('classId is required')
      } else if (isNaN(parseInt(row.classId))) {
        errors.push(`classId "${row.classId}" is not a valid number`)
      } else {
        const classId = parseInt(row.classId)
        const classExists = classes.value.find(c => c.id === classId)
        if (!classExists) {
          errors.push(`classId ${classId} does not exist. Available class IDs: ${classes.value.map(c => c.id).join(', ')}`)
        }
      }

      // Validate subjectId
      if (!row.subjectId || row.subjectId === '') {
        errors.push('subjectId is required')
      } else if (isNaN(parseInt(row.subjectId))) {
        errors.push(`subjectId "${row.subjectId}" is not a valid number`)
      } else {
        const subjectId = parseInt(row.subjectId)
        const subjectExists = subjects.value.find(s => s.id === subjectId)
        if (!subjectExists) {
          errors.push(`subjectId ${subjectId} does not exist. Available subject IDs: ${subjects.value.map(s => s.id).join(', ')}`)
        }
      }

      // Validate teacherId
      if (!row.teacherId || row.teacherId === '') {
        errors.push('teacherId is required')
      } else if (isNaN(parseInt(row.teacherId))) {
        errors.push(`teacherId "${row.teacherId}" is not a valid number`)
      } else {
        const teacherId = parseInt(row.teacherId)
        const teacherExists = teachers.value.find(t => t.id === teacherId)
        if (!teacherExists) {
          errors.push(`teacherId ${teacherId} does not exist. Available teacher IDs: ${teachers.value.map(t => t.id).join(', ')}`)
        }
      }

      // Validate academicPeriodId
      if (!row.academicPeriodId || row.academicPeriodId === '') {
        errors.push('academicPeriodId is required')
      } else if (isNaN(parseInt(row.academicPeriodId))) {
        errors.push(`academicPeriodId "${row.academicPeriodId}" is not a valid number`)
      } else {
        const periodId = parseInt(row.academicPeriodId)
        const periodExists = academicPeriods.value.find(p => p.id === periodId)
        if (!periodExists) {
          errors.push(`academicPeriodId ${periodId} does not exist. Available period IDs: ${academicPeriods.value.map(p => p.id).join(', ')}`)
        }
      }

      // Validate dayOfWeek
      if (!row.dayOfWeek || row.dayOfWeek === '') {
        errors.push('dayOfWeek is required')
      } else if (isNaN(parseInt(row.dayOfWeek))) {
        errors.push(`dayOfWeek "${row.dayOfWeek}" is not a valid number`)
      } else {
        const dayOfWeek = parseInt(row.dayOfWeek)
        if (dayOfWeek < 1 || dayOfWeek > 7) {
          errors.push(`dayOfWeek must be between 1-7 (1=Monday, 7=Sunday), got ${dayOfWeek}`)
        }
      }

      // Validate startTime
      if (!row.startTime || row.startTime === '') {
        errors.push('startTime is required')
      } else if (!row.startTime.match(/^\d{2}:\d{2}(:\d{2})?$/)) {
        errors.push(`startTime "${row.startTime}" has invalid format. Expected HH:mm or HH:mm:ss`)
      }

      // Validate endTime
      if (!row.endTime || row.endTime === '') {
        errors.push('endTime is required')
      } else if (!row.endTime.match(/^\d{2}:\d{2}(:\d{2})?$/)) {
        errors.push(`endTime "${row.endTime}" has invalid format. Expected HH:mm or HH:mm:ss`)
      }

      // Validate time logic
      if (row.startTime && row.endTime &&
          row.startTime.match(/^\d{2}:\d{2}(:\d{2})?$/) &&
          row.endTime.match(/^\d{2}:\d{2}(:\d{2})?$/)) {
        const startParts = row.startTime.split(':')
        const endParts = row.endTime.split(':')
        const startMinutes = parseInt(startParts[0]) * 60 + parseInt(startParts[1])
        const endMinutes = parseInt(endParts[0]) * 60 + parseInt(endParts[1])

        if (startMinutes >= endMinutes) {
          errors.push(`startTime (${row.startTime}) must be before endTime (${row.endTime})`)
        }
      }

      // Validate room
      if (!row.room || row.room.trim() === '') {
        errors.push('room is required')
      }

      // Add errors to validation list
      if (errors.length > 0) {
        validationErrors.push(`Row ${rowNumber}: ${errors.join('; ')}`)
      }

      // Ensure time has seconds format
      const startTime = row.startTime && row.startTime.match(/^\d{2}:\d{2}$/)
        ? `${row.startTime}:00`
        : row.startTime
      const endTime = row.endTime && row.endTime.match(/^\d{2}:\d{2}$/)
        ? `${row.endTime}:00`
        : row.endTime

      return {
        classId: parseInt(row.classId) || 0,
        subjectId: parseInt(row.subjectId) || 0,
        teacherId: parseInt(row.teacherId) || 0,
        academicPeriodId: parseInt(row.academicPeriodId) || 0,
        dayOfWeek: parseInt(row.dayOfWeek) || 0,
        startTime: startTime,
        endTime: endTime,
        room: row.room || '',
        isValid: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined
      }
    })

    // Set validation errors
    csvValidationErrors.value = validationErrors

    // If there are errors, don't navigate
    if (validationErrors.length > 0) {
      csvError.value = `Found ${validationErrors.length} validation error(s). Please fix the issues and try again.`
      processingCsv.value = false
      return
    }

    // Navigate to preview page
    showCsvUploadModal.value = false
    router.push({
      path: '/schedule/class-schedule/bulk-preview',
      state: { previewData }
    })
  } catch (err: any) {
    csvError.value = 'Failed to parse CSV file: ' + err.message
    csvValidationErrors.value = ['Make sure the file is a valid CSV format with comma-separated values']
  } finally {
    processingCsv.value = false
  }
}

// Utility functions
const formatTime = (time?: string) => {
  if (!time) return '-'

  // Handle ISO datetime string (1970-01-01T07:00:00.000Z)
  if (time.includes('T')) {
    const date = new Date(time)
    const hours = date.getUTCHours().toString().padStart(2, '0')
    const minutes = date.getUTCMinutes().toString().padStart(2, '0')
    return `${hours}:${minutes}`
  }

  // Handle time-only string (07:00:00 or 07:00)
  const parts = time.split(':')
  return `${parts[0]}:${parts[1]}`
}

// Helper to format time for input fields
const formatTimeForInput = (time?: string): string => {
  if (!time) return ''

  if (time.includes('T')) {
    const date = new Date(time)
    const hours = date.getUTCHours().toString().padStart(2, '0')
    const minutes = date.getUTCMinutes().toString().padStart(2, '0')
    return `${hours}:${minutes}`
  }

  const parts = time.split(':')
  return `${parts[0]}:${parts[1]}`
}

// Initialize
onMounted(async () => {
  await loadDropdownData()
  await fetchSchedules()
})
</script>
