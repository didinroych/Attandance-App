<template>
  <admin-layout>
    <div class="mx-auto max-w-7xl">
      <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h2 class="text-title-md2 font-bold text-gray-900 dark:text-white">
        Subject Management
      </h2>
      <button
        @click="openCreateModal"
        type="button"
        class="inline-flex items-center gap-2.5 rounded-md bg-blue-600 px-4 py-2.5 text-center font-medium text-white hover:bg-opacity-90"
      >
        <svg
          class="fill-current"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M10 4V16M16 10H4"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          />
        </svg>
        Add Subject
      </button>
    </div>

    <!-- Error Display -->
    <div
      v-if="error"
      class="mb-4 rounded-md bg-red-50 dark:bg-red-900/20 p-4"
    >
      <p class="text-sm text-red-800 dark:text-red-200">{{ error }}</p>
    </div>

    <!-- Search Bar -->
    <div class="mb-4 flex gap-3">
      <div class="flex-1">
        <input
          v-model="searchInput"
          @input="debouncedSearch"
          type="text"
          placeholder="Search by name or code..."
          class="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
      </div>
      <button
        v-if="searchInput"
        @click="clearSearch"
        type="button"
        class="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
      >
        Clear
      </button>
    </div>

    <!-- Data Table -->
    <div class="rounded-sm border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
      <data-table
        :columns="columns"
        :data="subjects"
        :loading="loading"
        :pagination="pagination"
        :sort-by="sortBy"
        :sort-order="sortOrder"
        :has-actions="true"
        :initial-limit="10"
        empty-message="No subjects found"
        @sort-change="handleSortChange"
        @page-change="handlePageChange"
        @limit-change="handleLimitChange"
      >
        <template #cell-scheduleCount="{ row }">
          <span class="inline-flex rounded-full bg-blue-100 dark:bg-blue-900/30 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:text-blue-200">
            {{ row.scheduleCount || 0 }} schedules
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
    <modal
      v-model="showFormModal"
      :title="isEditMode ? 'Edit Subject' : 'Add New Subject'"
      size="lg"
    >
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label class="mb-2.5 block text-gray-900 dark:text-white">
            Name <span class="text-red-500">*</span>
          </label>
          <input
            v-model="formData.name"
            type="text"
            required
            maxlength="100"
            class="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
            placeholder="e.g., Mathematics"
          />
        </div>
        <div>
          <label class="mb-2.5 block text-gray-900 dark:text-white">
            Code
          </label>
          <input
            v-model="formData.code"
            type="text"
            maxlength="10"
            class="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
            placeholder="e.g., MTK"
          />
        </div>
        <div>
          <label class="mb-2.5 block text-gray-900 dark:text-white">
            Description
          </label>
          <textarea
            v-model="formData.description"
            rows="4"
            maxlength="1000"
            class="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
            placeholder="Enter subject description..."
          ></textarea>
        </div>
      </form>
      <template #footer>
        <div class="flex gap-3">
          <button
            @click="handleSubmit"
            :disabled="submitting || !formData.name"
            type="button"
            class="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ submitting ? 'Saving...' : (isEditMode ? 'Update' : 'Create') }}
          </button>
          <button
            @click="showFormModal = false"
            type="button"
            class="rounded-md bg-white dark:bg-gray-800 px-4 py-2 text-sm font-semibold text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
        </div>
      </template>
    </modal>

    <!-- Details Modal -->
    <modal
      v-model="showDetailsModal"
      :title="selectedSubject?.name || 'Subject Details'"
      size="xl"
    >
      <div v-if="selectedSubject" class="space-y-6">
        <!-- Subject Info -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
            <p class="mt-1 text-sm text-gray-900 dark:text-white">{{ selectedSubject.name }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Code</label>
            <p class="mt-1 text-sm text-gray-900 dark:text-white">{{ selectedSubject.code || '-' }}</p>
          </div>
          <div class="col-span-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
            <p class="mt-1 text-sm text-gray-900 dark:text-white">{{ selectedSubject.description || '-' }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Created At</label>
            <p class="mt-1 text-sm text-gray-900 dark:text-white">{{ formatDate(selectedSubject.createdAt) }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Schedule Count</label>
            <p class="mt-1 text-sm text-gray-900 dark:text-white">{{ selectedSubject.scheduleCount || 0 }}</p>
          </div>
        </div>

        <!-- Schedules -->
        <div v-if="selectedSubject.schedules && selectedSubject.schedules.length > 0">
          <h3 class="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Related Schedules</h3>
          <div class="space-y-2">
            <div
              v-for="schedule in selectedSubject.schedules"
              :key="schedule.id"
              class="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3"
            >
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ schedule.className }} (Grade {{ schedule.gradeLevel }})
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    Teacher: {{ schedule.teacherName }}
                  </p>
                </div>
                <div class="text-right">
                  <p class="text-sm text-gray-900 dark:text-white">
                    {{ getDayName(schedule.dayOfWeek) }}
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    {{ schedule.startTime }} - {{ schedule.endTime }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="flex gap-3">
          <button
            @click="enableEditMode"
            type="button"
            class="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            Edit
          </button>
          <button
            @click="showDetailsModal = false"
            type="button"
            class="rounded-md bg-white dark:bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </template>
    </modal>

    <!-- Delete Confirmation -->
    <confirm-dialog
      v-model="showDeleteConfirm"
      :title="deleteDialogTitle"
      :message="deleteDialogMessage"
      type="danger"
      :confirm-text="forceDelete ? 'Force Delete' : 'Delete'"
      :loading="deleting"
      @confirm="confirmDelete"
    />
    </div>
  </admin-layout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useSubjectManagement } from '@/composables/useSubjectManagement'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import DataTable from '@/components/common/DataTable.vue'
import Modal from '@/components/common/Modal.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import type { Subject, SubjectFormData, SubjectDetailsResponse } from '@/types/subject'
import type { TableColumn } from '@/components/common/DataTable.vue'

const {
  subjects,
  loading,
  error,
  pagination,
  sortBy,
  sortOrder,
  fetchSubjects,
  handlePageChange,
  handleSortChange,
  handleSearch,
  clearSearch: clearSearchQuery,
  createSubject,
  updateSubject,
  deleteSubject,
  getSubjectById
} = useSubjectManagement()

// Table columns
const columns: TableColumn[] = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'code', label: 'Code', sortable: true, format: (value) => value || '-' },
  { key: 'description', label: 'Description', format: (value) => value || '-' },
  { key: 'scheduleCount', label: 'Schedules', sortable: false }
]

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

// Pagination limit handler
const handleLimitChange = (newLimit: number) => {
  pagination.value.limit = newLimit
  pagination.value.currentPage = 1 // Reset to first page
  fetchSubjects()
}

// Form Modal
const showFormModal = ref(false)
const isEditMode = ref(false)
const submitting = ref(false)
const editingSubjectId = ref<number | null>(null)
const formData = ref<SubjectFormData>({
  name: '',
  code: '',
  description: ''
})

const openCreateModal = () => {
  isEditMode.value = false
  editingSubjectId.value = null
  formData.value = { name: '', code: '', description: '' }
  showFormModal.value = true
}

const enableEditMode = () => {
  if (!selectedSubject.value) return
  isEditMode.value = true
  editingSubjectId.value = selectedSubject.value.id
  formData.value = {
    name: selectedSubject.value.name,
    code: selectedSubject.value.code || '',
    description: selectedSubject.value.description || ''
  }
  showDetailsModal.value = false
  showFormModal.value = true
}

const handleSubmit = async () => {
  if (!formData.value.name) return

  submitting.value = true
  let success = false

  if (isEditMode.value && editingSubjectId.value) {
    success = await updateSubject(editingSubjectId.value, formData.value)
  } else {
    success = await createSubject(formData.value)
  }

  submitting.value = false

  if (success) {
    showFormModal.value = false
    formData.value = { name: '', code: '', description: '' }
  }
}

// Details Modal
const showDetailsModal = ref(false)
const selectedSubject = ref<SubjectDetailsResponse | null>(null)

const openDetailsModal = async (subject: Subject) => {
  const details = await getSubjectById(subject.id)
  if (details) {
    selectedSubject.value = details
    showDetailsModal.value = true
  }
}

// Delete
const showDeleteConfirm = ref(false)
const deleting = ref(false)
const subjectToDelete = ref<Subject | null>(null)
const forceDelete = ref(false)

const deleteDialogTitle = computed(() => {
  if (!subjectToDelete.value) return 'Delete Subject'
  const scheduleCount = subjectToDelete.value.scheduleCount || 0
  return scheduleCount > 0 ? 'Warning: Subject in Use' : 'Delete Subject'
})

const deleteDialogMessage = computed(() => {
  if (!subjectToDelete.value) return ''
  const scheduleCount = subjectToDelete.value.scheduleCount || 0

  if (scheduleCount > 0) {
    forceDelete.value = true
    return `This subject is being used in ${scheduleCount} schedule(s). Deleting it will also remove all related schedules. Are you sure you want to proceed?`
  }

  forceDelete.value = false
  return `Are you sure you want to delete "${subjectToDelete.value.name}"? This action cannot be undone.`
})

const openDeleteConfirm = (subject: Subject) => {
  subjectToDelete.value = subject
  showDeleteConfirm.value = true
}

const confirmDelete = async () => {
  if (!subjectToDelete.value) return

  deleting.value = true
  const success = await deleteSubject(subjectToDelete.value.id, forceDelete.value)
  deleting.value = false

  // Always close the modal and clear selection
  showDeleteConfirm.value = false
  subjectToDelete.value = null

  // If failed, error message will be displayed at the top of the page
  if (!success) {
    // Scroll to top to show error message
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

// Utility functions
const formatDate = (date?: string) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString()
}

const getDayName = (dayOfWeek: number) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return days[dayOfWeek] || '-'
}

// Initialize
onMounted(() => {
  fetchSubjects()
})
</script>
