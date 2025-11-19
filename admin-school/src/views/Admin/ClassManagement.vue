<template>
  <admin-layout>
    <div class="mx-auto max-w-7xl">
      <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 class="text-title-md2 font-bold text-gray-900 dark:text-white">
          Class Management
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
          Add Class
        </button>
      </div>

      <!-- Success Display -->
      <div
        v-if="successMessage"
        class="mb-4 rounded-md bg-green-50 dark:bg-green-900/20 p-4"
      >
        <p class="text-sm text-green-800 dark:text-green-200">{{ successMessage }}</p>
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
            placeholder="Search by class name..."
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
          :data="classes"
          :loading="loading"
          :pagination="pagination"
          :sort-by="sortBy"
          :sort-order="sortOrder"
          :has-actions="true"
          :initial-limit="20"
          empty-message="No classes found"
          @sort-change="handleSortChange"
          @page-change="handlePageChange"
          @limit-change="handleLimitChange"
        >
          <template #cell-studentCount="{ row }">
            <span class="inline-flex rounded-full bg-blue-100 dark:bg-blue-900/30 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:text-blue-200">
              {{ row.studentCount || 0 }} students
            </span>
          </template>
          <template #cell-scheduleCount="{ row }">
            <span class="inline-flex rounded-full bg-green-100 dark:bg-green-900/30 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:text-green-200">
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
        :title="isEditMode ? 'Edit Class' : 'Add New Class'"
        size="lg"
      >
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label class="mb-2.5 block text-gray-900 dark:text-white">
              Class Name <span class="text-red-500">*</span>
            </label>
            <input
              v-model="formData.name"
              type="text"
              required
              maxlength="20"
              class="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
              placeholder="e.g., 7A, 12 IPA 1"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="mb-2.5 block text-gray-900 dark:text-white">
                School Level <span class="text-red-500">*</span>
              </label>
              <select
                v-model="formData.schoolLevelId"
                required
                class="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="">Select level</option>
                <option
                  v-for="level in schoolLevels"
                  :key="level.id"
                  :value="level.id"
                >
                  {{ level.name }} - {{ level.description }}
                </option>
              </select>
            </div>

            <div>
              <label class="mb-2.5 block text-gray-900 dark:text-white">
                Grade Level <span class="text-red-500">*</span>
              </label>
              <input
                v-model.number="formData.gradeLevel"
                type="number"
                required
                min="1"
                max="12"
                class="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
                placeholder="1-12"
              />
            </div>
          </div>

          <div>
            <label class="mb-2.5 block text-gray-900 dark:text-white">
              Academic Period <span class="text-red-500">*</span>
            </label>
            <select
              v-model="formData.academicPeriodId"
              required
              class="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="">Select period</option>
              <option
                v-for="period in academicPeriods"
                :key="period.id"
                :value="period.id"
              >
                {{ period.name }}
              </option>
            </select>
          </div>

          <div>
            <label class="mb-2.5 block text-gray-900 dark:text-white">
              Homeroom Teacher (Optional)
            </label>
            <select
              v-model="formData.homeroomTeacherId"
              class="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
            >
              <option :value="null">No homeroom teacher</option>
              <option
                v-for="teacher in teachers"
                :key="teacher.id"
                :value="teacher.userId"
              >
                {{ teacher.fullName }}
              </option>
            </select>
          </div>
        </form>
        <template #footer>
          <div class="flex gap-3">
            <button
              @click="handleSubmit"
              :disabled="submitting || !isFormValid"
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
import { useRouter } from 'vue-router'
import { useClassManagement } from '@/composables/useClassManagement'
import academicPeriodService from '@/services/academicPeriod.service'
import userManagementService from '@/services/userManagement.service'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import DataTable from '@/components/common/DataTable.vue'
import Modal from '@/components/common/Modal.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import type { Class, ClassFormData, ClassDetailsResponse, SchoolLevel } from '@/types/class'
import type { AcademicPeriod } from '@/types/academicPeriod'
import type { Teacher } from '@/types/user'
import type { TableColumn } from '@/components/common/DataTable.vue'

const router = useRouter()
const successMessage = ref<string | null>(null)

// Auto-dismiss success message
const showSuccessMessage = (message: string) => {
  successMessage.value = message
  setTimeout(() => {
    successMessage.value = null
  }, 5000)
}

const {
  classes,
  loading,
  error,
  pagination,
  sortBy,
  sortOrder,
  fetchClasses,
  handlePageChange,
  handleSortChange,
  handleSearch,
  clearSearch: clearSearchQuery,
  createClass,
  updateClass,
  deleteClass,
  getClassById
} = useClassManagement()

// Table columns
const columns: TableColumn[] = [
  { key: 'name', label: 'Class Name', sortable: true },
  { key: 'gradeLevel', label: 'Grade', sortable: true },
  { key: 'schoolLevel', label: 'Level', sortable: false },
  { key: 'academicPeriod', label: 'Period', sortable: false, nowrap: false },
  { key: 'studentCount', label: 'Students', sortable: false },
  { key: 'scheduleCount', label: 'Schedules', sortable: false }
]

// Dropdown data
const schoolLevels = ref<SchoolLevel[]>([
  { id: 1, name: 'SD', description: 'Elementary (Grade 1-6)' },
  { id: 2, name: 'SMP', description: 'Junior High (Grade 7-9)' },
  { id: 3, name: 'SMA', description: 'Senior High (Grade 10-12)' }
])
const academicPeriods = ref<AcademicPeriod[]>([])
const teachers = ref<Teacher[]>([])

// Load dropdown data
const loadDropdownData = async () => {
  try {
    // Load academic periods (all, sorted by start date desc)
    const periodsResponse = await academicPeriodService.getAcademicPeriods({
      limit: 100,
      sortBy: 'startDate',
      sortOrder: 'desc'
    })
    academicPeriods.value = periodsResponse.academicPeriods

    // Load teachers (all, sorted by name)
    const teachersResponse = await userManagementService.getUsers<Teacher>({
      role: 'teacher',
      limit: 100,
      sortBy: 'fullName',
      sortOrder: 'asc'
    })
    teachers.value = teachersResponse.users
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

// Pagination limit handler
const handleLimitChange = (newLimit: number) => {
  pagination.value.limit = newLimit
  pagination.value.currentPage = 1
  fetchClasses()
}

// Form Modal
const showFormModal = ref(false)
const isEditMode = ref(false)
const submitting = ref(false)
const editingClassId = ref<number | null>(null)
const formData = ref<ClassFormData>({
  name: '',
  schoolLevelId: 0,
  gradeLevel: 0,
  academicPeriodId: 0,
  homeroomTeacherId: null
})

const isFormValid = computed(() => {
  return formData.value.name.trim() !== '' &&
    formData.value.schoolLevelId > 0 &&
    formData.value.gradeLevel >= 1 &&
    formData.value.gradeLevel <= 12 &&
    formData.value.academicPeriodId > 0
})

const openCreateModal = () => {
  isEditMode.value = false
  editingClassId.value = null
  formData.value = {
    name: '',
    schoolLevelId: 0,
    gradeLevel: 0,
    academicPeriodId: 0,
    homeroomTeacherId: null
  }
  showFormModal.value = true
}

const handleSubmit = async () => {
  if (!isFormValid.value) return

  submitting.value = true
  let success = false

  if (isEditMode.value && editingClassId.value) {
    success = await updateClass(editingClassId.value, formData.value)
    if (success) {
      showSuccessMessage('Class updated successfully!')
    }
  } else {
    success = await createClass(formData.value)
    if (success) {
      showSuccessMessage('Class created successfully!')
    }
  }

  submitting.value = false

  if (success) {
    showFormModal.value = false
    formData.value = {
      name: '',
      schoolLevelId: 0,
      gradeLevel: 0,
      academicPeriodId: 0,
      homeroomTeacherId: null
    }
  }
}

// Navigate to details page
const openDetailsModal = (classItem: Class) => {
  router.push(`/admin/academic/class/${classItem.id}`)
}

// Delete
const showDeleteConfirm = ref(false)
const deleting = ref(false)
const classToDelete = ref<Class | null>(null)
const forceDelete = ref(false)

const deleteDialogTitle = computed(() => {
  if (!classToDelete.value) return 'Delete Class'
  const studentCount = classToDelete.value.studentCount || 0
  const scheduleCount = classToDelete.value.scheduleCount || 0
  return (studentCount > 0 || scheduleCount > 0) ? 'Warning: Class in Use' : 'Delete Class'
})

const deleteDialogMessage = computed(() => {
  if (!classToDelete.value) return ''
  const studentCount = classToDelete.value.studentCount || 0
  const scheduleCount = classToDelete.value.scheduleCount || 0

  if (studentCount > 0 || scheduleCount > 0) {
    forceDelete.value = true
    return `This class has ${studentCount} student(s) and ${scheduleCount} schedule(s). Deleting it will also remove all related data. Are you sure you want to proceed?`
  }

  forceDelete.value = false
  return `Are you sure you want to delete "${classToDelete.value.name}"? This action cannot be undone.`
})

const openDeleteConfirm = (classItem: Class) => {
  classToDelete.value = classItem
  showDeleteConfirm.value = true
}

const confirmDelete = async () => {
  if (!classToDelete.value) return

  deleting.value = true
  const success = await deleteClass(classToDelete.value.id, forceDelete.value)
  deleting.value = false

  showDeleteConfirm.value = false
  classToDelete.value = null

  if (success) {
    showSuccessMessage('Class deleted successfully!')
  } else {
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

const formatTime = (time?: string) => {
  if (!time) return '-'
  const date = new Date(time)
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}

// Initialize
onMounted(async () => {
  await loadDropdownData()
  fetchClasses()
})
</script>
