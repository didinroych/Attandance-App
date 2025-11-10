<template>
  <admin-layout>
    <div class="mx-auto max-w-7xl">
      <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 class="text-title-md2 font-bold text-gray-900 dark:text-white">
          Academic Period Management
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
          Add Academic Period
        </button>
      </div>

      <!-- Success Message -->
      <div
        v-if="successMessage"
        class="mb-4 flex items-center justify-between rounded-md bg-green-50 dark:bg-green-900/20 p-4"
      >
        <p class="text-sm text-green-800 dark:text-green-200">{{ successMessage }}</p>
        <button
          @click="clearMessages"
          class="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200"
        >
          <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fill-rule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clip-rule="evenodd"
            />
          </svg>
        </button>
      </div>

      <!-- Error Display -->
      <div
        v-if="error"
        class="mb-4 flex items-center justify-between rounded-md bg-red-50 dark:bg-red-900/20 p-4"
      >
        <p class="text-sm text-red-800 dark:text-red-200">{{ error }}</p>
        <button
          @click="clearMessages"
          class="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
        >
          <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fill-rule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clip-rule="evenodd"
            />
          </svg>
        </button>
      </div>

      <!-- Search Bar -->
      <div class="mb-4 flex gap-3">
        <div class="flex-1">
          <input
            v-model="searchInput"
            @input="debouncedSearch"
            type="text"
            placeholder="Search by period name..."
            class="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <button
          v-if="searchInput"
          @click="clearSearchInput"
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
          :data="academicPeriods"
          :loading="loading"
          :pagination="pagination"
          :sort-by="sortBy"
          :sort-order="sortOrder"
          :has-actions="true"
          :initial-limit="10"
          empty-message="No academic periods found"
          @sort-change="handleSortChange"
          @page-change="handlePageChange"
          @limit-change="handleLimitChange"
        >
          <template #cell-startDate="{ value }">
            {{ formatDate(value) }}
          </template>
          <template #cell-endDate="{ value }">
            {{ formatDate(value) }}
          </template>
          <template #cell-isActive="{ row }">
            <span
              v-if="row.isActive"
              class="inline-flex rounded-full bg-green-100 dark:bg-green-900/30 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:text-green-200"
            >
              Active
            </span>
            <span
              v-else
              class="inline-flex rounded-full bg-gray-100 dark:bg-gray-700 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:text-gray-300"
            >
              Inactive
            </span>
          </template>
          <template #cell-classCount="{ row }">
            <span class="inline-flex rounded-full bg-blue-100 dark:bg-blue-900/30 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:text-blue-200">
              {{ row.classCount || 0 }} classes
            </span>
          </template>
          <template #cell-scheduleCount="{ row }">
            <span class="inline-flex rounded-full bg-purple-100 dark:bg-purple-900/30 px-2.5 py-0.5 text-xs font-medium text-purple-800 dark:text-purple-200">
              {{ row.scheduleCount || 0 }} schedules
            </span>
          </template>
          <template #actions="{ row }">
            <div class="flex items-center gap-2">
              <button
                @click="openDetailsModal(row)"
                class="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                title="View Details"
              >
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              </button>
              <button
                @click="openEditModal(row)"
                class="text-yellow-600 dark:text-yellow-400 hover:text-yellow-900 dark:hover:text-yellow-300"
                title="Edit"
              >
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>
              <button
                @click="openDeleteConfirm(row)"
                class="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                title="Delete"
              >
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          </template>
        </data-table>
      </div>

      <!-- Create/Edit Modal -->
      <modal v-model="showFormModal" :title="isEditMode ? 'Edit Academic Period' : 'Create Academic Period'" size="lg">
        <form @submit.prevent="handleFormSubmit" class="space-y-4">
          <div>
            <label class="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
              Period Name <span class="text-red-500">*</span>
            </label>
            <input
              v-model="formData.name"
              type="text"
              required
              maxlength="100"
              placeholder="e.g., 2024/2025 Semester 1"
              class="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label class="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                Start Date <span class="text-red-500">*</span>
              </label>
              <input
                v-model="formData.startDate"
                type="date"
                required
                class="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label class="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                End Date <span class="text-red-500">*</span>
              </label>
              <input
                v-model="formData.endDate"
                type="date"
                required
                class="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div>
            <label class="flex items-center gap-2">
              <input
                v-model="formData.isActive"
                type="checkbox"
                class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span class="text-sm font-medium text-gray-900 dark:text-white">Set as Active Period</span>
            </label>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Note: Setting this as active will automatically deactivate all other periods
            </p>
          </div>

          <div class="flex justify-end gap-3 pt-4">
            <button
              type="button"
              @click="showFormModal = false"
              class="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="submitting"
              class="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {{ submitting ? 'Saving...' : (isEditMode ? 'Update' : 'Create') }}
            </button>
          </div>
        </form>
      </modal>

      <!-- Details Modal -->
      <modal v-model="showDetailsModal" title="Academic Period Details" size="xl">
        <div v-if="selectedPeriodDetails" class="space-y-6">
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Period Name</p>
              <p class="mt-1 text-base text-gray-900 dark:text-white">{{ selectedPeriodDetails.name }}</p>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Status</p>
              <span
                v-if="selectedPeriodDetails.isActive"
                class="mt-1 inline-flex rounded-full bg-green-100 dark:bg-green-900/30 px-3 py-1 text-sm font-medium text-green-800 dark:text-green-200"
              >
                Active
              </span>
              <span
                v-else
                class="mt-1 inline-flex rounded-full bg-gray-100 dark:bg-gray-700 px-3 py-1 text-sm font-medium text-gray-800 dark:text-gray-300"
              >
                Inactive
              </span>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Start Date</p>
              <p class="mt-1 text-base text-gray-900 dark:text-white">{{ formatDate(selectedPeriodDetails.startDate) }}</p>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">End Date</p>
              <p class="mt-1 text-base text-gray-900 dark:text-white">{{ formatDate(selectedPeriodDetails.endDate) }}</p>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Classes</p>
              <p class="mt-1 text-base text-gray-900 dark:text-white">{{ selectedPeriodDetails.classCount || 0 }}</p>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Schedules</p>
              <p class="mt-1 text-base text-gray-900 dark:text-white">{{ selectedPeriodDetails.scheduleCount || 0 }}</p>
            </div>
          </div>

          <div v-if="selectedPeriodDetails.classes && selectedPeriodDetails.classes.length > 0">
            <h4 class="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Associated Classes</h4>
            <div class="space-y-2">
              <div
                v-for="classItem in selectedPeriodDetails.classes"
                :key="classItem.id"
                class="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3"
              >
                <p class="font-medium text-gray-900 dark:text-white">{{ classItem.name }}</p>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  Grade {{ classItem.gradeLevel }} - {{ classItem.schoolLevel }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <template #footer>
          <button
            @click="showDetailsModal = false"
            class="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Close
          </button>
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
import { useAcademicPeriodManagement } from '@/composables/useAcademicPeriodManagement'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import DataTable from '@/components/common/DataTable.vue'
import Modal from '@/components/common/Modal.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import type { AcademicPeriod, AcademicPeriodFormData, AcademicPeriodDetailsResponse } from '@/types/academicPeriod'
import type { TableColumn } from '@/components/common/DataTable.vue'

const {
  academicPeriods,
  loading,
  error,
  successMessage,
  pagination,
  sortBy,
  sortOrder,
  fetchAcademicPeriods,
  handlePageChange,
  handleSortChange,
  handleSearch,
  clearSearch,
  createAcademicPeriod,
  updateAcademicPeriod,
  deleteAcademicPeriod,
  getAcademicPeriodById,
  clearMessages
} = useAcademicPeriodManagement()

// Table columns
const columns: TableColumn[] = [
  { key: 'name', label: 'Period Name', sortable: true },
  { key: 'startDate', label: 'Start Date', sortable: true },
  { key: 'endDate', label: 'End Date', sortable: true },
  { key: 'isActive', label: 'Status', sortable: false },
  { key: 'classCount', label: 'Classes', sortable: false },
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

const clearSearchInput = () => {
  searchInput.value = ''
  clearSearch()
}

// Pagination limit handler
const handleLimitChange = (newLimit: number) => {
  pagination.value.limit = newLimit
  pagination.value.currentPage = 1
  fetchAcademicPeriods()
}

// Form Modal
const showFormModal = ref(false)
const isEditMode = ref(false)
const submitting = ref(false)
const editingPeriodId = ref<number | null>(null)
const formData = ref<AcademicPeriodFormData>({
  name: '',
  startDate: '',
  endDate: '',
  isActive: false
})

const openCreateModal = () => {
  isEditMode.value = false
  editingPeriodId.value = null
  formData.value = { name: '', startDate: '', endDate: '', isActive: false }
  showFormModal.value = true
}

const formatDateForInput = (dateString: string): string => {
  // Convert date string to YYYY-MM-DD format for HTML date input
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const openEditModal = (period: AcademicPeriod) => {
  isEditMode.value = true
  editingPeriodId.value = period.id
  formData.value = {
    name: period.name,
    startDate: formatDateForInput(period.startDate),
    endDate: formatDateForInput(period.endDate),
    isActive: period.isActive
  }
  showFormModal.value = true
}

const handleFormSubmit = async () => {
  submitting.value = true
  try {
    let success = false
    if (isEditMode.value && editingPeriodId.value) {
      success = await updateAcademicPeriod(editingPeriodId.value, formData.value)
    } else {
      success = await createAcademicPeriod(formData.value)
    }

    if (success) {
      showFormModal.value = false
    }
  } finally {
    submitting.value = false
  }
}

// Details Modal
const showDetailsModal = ref(false)
const selectedPeriodDetails = ref<AcademicPeriodDetailsResponse | null>(null)

const openDetailsModal = async (period: AcademicPeriod) => {
  const details = await getAcademicPeriodById(period.id)
  if (details) {
    selectedPeriodDetails.value = details
    showDetailsModal.value = true
  }
}

// Delete Confirmation
const showDeleteConfirm = ref(false)
const deleting = ref(false)
const deletingPeriod = ref<AcademicPeriod | null>(null)
const forceDelete = ref(false)

const deleteDialogTitle = computed(() => {
  if (!deletingPeriod.value) return ''
  const hasUsage = (deletingPeriod.value.classCount || 0) > 0 || (deletingPeriod.value.scheduleCount || 0) > 0
  return hasUsage && !forceDelete.value ? 'Period In Use' : 'Confirm Delete'
})

const deleteDialogMessage = computed(() => {
  if (!deletingPeriod.value) return ''

  const classCount = deletingPeriod.value.classCount || 0
  const scheduleCount = deletingPeriod.value.scheduleCount || 0
  const hasUsage = classCount > 0 || scheduleCount > 0

  if (hasUsage && !forceDelete.value) {
    return `This academic period is being used by ${classCount} class(es) and ${scheduleCount} schedule(s). Would you like to force delete? This will remove all related data.`
  }

  if (forceDelete.value) {
    return `Are you sure you want to force delete "${deletingPeriod.value.name}"? This will permanently delete the period and ALL related classes and schedules. This action cannot be undone.`
  }

  return `Are you sure you want to delete "${deletingPeriod.value.name}"? This action cannot be undone.`
})

const openDeleteConfirm = (period: AcademicPeriod) => {
  deletingPeriod.value = period
  forceDelete.value = false
  showDeleteConfirm.value = true
}

const confirmDelete = async () => {
  if (!deletingPeriod.value) return

  deleting.value = true
  const success = await deleteAcademicPeriod(deletingPeriod.value.id, forceDelete.value)

  if (success) {
    showDeleteConfirm.value = false
    deletingPeriod.value = null
    forceDelete.value = false
  } else {
    // If delete failed and not forcing yet, offer force delete
    const hasUsage = (deletingPeriod.value.classCount || 0) > 0 || (deletingPeriod.value.scheduleCount || 0) > 0
    if (hasUsage && !forceDelete.value) {
      forceDelete.value = true
    } else {
      showDeleteConfirm.value = false
    }
  }

  deleting.value = false
}

// Date formatting
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

// Initialize
onMounted(() => {
  fetchAcademicPeriods()
})
</script>
