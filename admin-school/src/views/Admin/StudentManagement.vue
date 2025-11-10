<template>
  <admin-layout>
    <div class="space-y-6">
      <!-- Header -->
      <div class="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Student Management</h1>
          <p class="mt-1 text-sm text-gray-500">Manage student accounts and information</p>
        </div>
        <div class="mt-4 sm:mt-0">
          <button
            @click="openImportModal"
            type="button"
            class="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Import CSV
          </button>
        </div>
      </div>

      <!-- Error Display -->
      <div v-if="error" class="rounded-md bg-red-50 p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm text-red-800">{{ error }}</p>
          </div>
        </div>
      </div>

      <!-- Search Bar -->
      <div class="flex items-center gap-4">
        <div class="flex-1">
          <div class="relative">
            <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <svg class="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clip-rule="evenodd" />
              </svg>
            </div>
            <input
              v-model="searchInput"
              @input="debouncedSearch"
              type="text"
              placeholder="Search students by name, email, or student ID..."
              class="block w-full rounded-md border-0 py-2 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
            />
          </div>
        </div>
        <button
          v-if="searchQuery"
          @click="clearSearch"
          type="button"
          class="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
        >
          Clear
        </button>
      </div>

      <!-- Data Table -->
      <data-table
        :columns="columns"
        :data="users"
        :loading="loading"
        :pagination="pagination"
        :sort-by="sortBy"
        :sort-order="sortOrder"
        :has-actions="true"
        empty-message="No students found"
        @sort-change="handleSortChange"
        @page-change="handlePageChange"
      >
        <!-- Custom cell for status -->
        <template #cell-isActive="{ row }">
          <span
            :class="[
              'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium',
              row.user?.isActive
                ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20'
                : 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20'
            ]"
          >
            {{ row.user?.isActive ? 'Active' : 'Inactive' }}
          </span>
        </template>

        <!-- Actions -->
        <template #actions="{ row }">
          <div class="flex items-center gap-3">
            <button
              @click="openDetailsModal(row)"
              class="text-blue-600 hover:text-blue-900"
              title="View Details"
            >
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
            <button
              @click="openDeleteConfirm(row)"
              class="text-red-600 hover:text-red-900"
              title="Delete"
            >
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </template>
      </data-table>

      <!-- Details Modal -->
      <modal
        v-model="showDetailsModal"
        :title="isEditMode ? 'Edit Student' : 'Student Details'"
        size="lg"
      >
        <div v-if="selectedStudent" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">Student ID</label>
              <input
                v-if="isEditMode"
                v-model="editForm.studentId"
                type="text"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
              <p v-else class="mt-1 text-sm text-gray-900">{{ selectedStudent.studentId }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Full Name</label>
              <input
                v-if="isEditMode"
                v-model="editForm.fullName"
                type="text"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
              <p v-else class="mt-1 text-sm text-gray-900">{{ selectedStudent.fullName }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Username</label>
              <input
                v-if="isEditMode"
                v-model="editForm.username"
                type="text"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
              <p v-else class="mt-1 text-sm text-gray-900">{{ selectedStudent.user?.username }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Email</label>
              <input
                v-if="isEditMode"
                v-model="editForm.email"
                type="email"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
              <p v-else class="mt-1 text-sm text-gray-900">{{ selectedStudent.user?.email }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Class ID</label>
              <input
                v-if="isEditMode"
                v-model.number="editForm.classId"
                type="number"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
              <p v-else class="mt-1 text-sm text-gray-900">{{ selectedStudent.class?.name || '-' }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Phone</label>
              <input
                v-if="isEditMode"
                v-model="editForm.phone"
                type="text"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
              <p v-else class="mt-1 text-sm text-gray-900">{{ selectedStudent.phone || '-' }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Parent Phone</label>
              <input
                v-if="isEditMode"
                v-model="editForm.parentPhone"
                type="text"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
              <p v-else class="mt-1 text-sm text-gray-900">{{ selectedStudent.parentPhone || '-' }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Date of Birth</label>
              <input
                v-if="isEditMode"
                v-model="editForm.dateOfBirth"
                type="date"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
              <p v-else class="mt-1 text-sm text-gray-900">{{ formatDate(selectedStudent.dateOfBirth) }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Enrollment Date</label>
              <input
                v-if="isEditMode"
                v-model="editForm.enrollmentDate"
                type="date"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
              <p v-else class="mt-1 text-sm text-gray-900">{{ formatDate(selectedStudent.enrollmentDate) }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Status</label>
              <p class="mt-1 text-sm text-gray-900">{{ selectedStudent.user?.isActive ? 'Active' : 'Inactive' }}</p>
            </div>
            <div class="col-span-2">
              <label class="block text-sm font-medium text-gray-700">Address</label>
              <textarea
                v-if="isEditMode"
                v-model="editForm.address"
                rows="2"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              ></textarea>
              <p v-else class="mt-1 text-sm text-gray-900">{{ selectedStudent.address || '-' }}</p>
            </div>
          </div>
        </div>
        <template #footer>
          <div class="flex gap-3">
            <button
              v-if="!isEditMode"
              @click="enableEditMode"
              type="button"
              class="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              Edit
            </button>
            <button
              v-if="isEditMode"
              @click="saveEdit"
              :disabled="updating"
              type="button"
              class="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ updating ? 'Updating...' : 'Update' }}
            </button>
            <button
              v-if="isEditMode"
              @click="cancelEdit"
              type="button"
              class="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              v-if="!isEditMode"
              @click="showDetailsModal = false"
              type="button"
              class="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </template>
      </modal>

      <!-- Import CSV Modal -->
      <modal
        v-model="showImportModal"
        title="Import Students from CSV"
        size="2xl"
      >
        <div class="space-y-4">
          <!-- Step 1: Upload CSV -->
          <div v-if="importStep === 'upload'">
            <csv-uploader
              ref="csvUploaderRef"
              @file-selected="handleFileSelected"
            >
              <template #instructions>
                <p class="mb-2">Your CSV file should include the following columns:</p>
                <ul class="list-inside list-disc space-y-1">
                  <li><strong>Required:</strong> username, email, password, studentId, fullName, classId</li>
                  <li><strong>Optional:</strong> phone, address, dateOfBirth, parentPhone, enrollmentDate</li>
                </ul>
                <button
                  @click="downloadTemplate"
                  type="button"
                  class="mt-3 text-sm font-medium text-blue-600 hover:text-blue-500"
                >
                  Download CSV Template
                </button>
              </template>
            </csv-uploader>
          </div>

          <!-- Step 2: Preview Data -->
          <div v-if="importStep === 'preview'">
            <div v-if="parsedData.errors.length > 0" class="mb-4 rounded-md bg-yellow-50 p-4">
              <div class="flex">
                <div class="flex-shrink-0">
                  <svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
                  </svg>
                </div>
                <div class="ml-3">
                  <h3 class="text-sm font-medium text-yellow-800">Validation Errors Found</h3>
                  <div class="mt-2 text-sm text-yellow-700">
                    <p class="mb-2">{{ parsedData.errors.length }} error(s) found. Please fix them before importing:</p>
                    <ul class="max-h-40 list-inside list-disc space-y-1 overflow-y-auto">
                      <li v-for="(err, idx) in parsedData.errors.slice(0, 10)" :key="idx">
                        Row {{ err.row }}, {{ err.field }}: {{ err.message }}
                      </li>
                      <li v-if="parsedData.errors.length > 10" class="font-medium">
                        ... and {{ parsedData.errors.length - 10 }} more errors
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="mb-4 rounded-md bg-green-50 p-4">
              <div class="flex">
                <div class="flex-shrink-0">
                  <svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" />
                  </svg>
                </div>
                <div class="ml-3">
                  <p class="text-sm text-green-800">
                    Successfully parsed {{ parsedData.data.length }} student(s). Ready to import!
                  </p>
                </div>
              </div>
            </div>

            <!-- Preview Table -->
            <div class="max-h-96 overflow-auto rounded-md border border-gray-200">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Username</th>
                    <th class="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Full Name</th>
                    <th class="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Student ID</th>
                    <th class="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Email</th>
                    <th class="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Class ID</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200 bg-white">
                  <tr v-for="(student, idx) in parsedData.data" :key="idx">
                    <td class="whitespace-nowrap px-4 py-2 text-sm text-gray-900">{{ student.username }}</td>
                    <td class="whitespace-nowrap px-4 py-2 text-sm text-gray-900">{{ student.fullName }}</td>
                    <td class="whitespace-nowrap px-4 py-2 text-sm text-gray-900">{{ student.studentId }}</td>
                    <td class="whitespace-nowrap px-4 py-2 text-sm text-gray-900">{{ student.email }}</td>
                    <td class="whitespace-nowrap px-4 py-2 text-sm text-gray-900">{{ student.classId }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Step 3: Import Results -->
          <div v-if="importStep === 'results' && importResults">
            <div class="mb-4 rounded-md bg-blue-50 p-4">
              <div class="flex">
                <div class="flex-shrink-0">
                  <svg class="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clip-rule="evenodd" />
                  </svg>
                </div>
                <div class="ml-3">
                  <h3 class="text-sm font-medium text-blue-800">Import Summary</h3>
                  <p class="mt-1 text-sm text-blue-700">
                    {{ importResults.message }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Failed imports -->
            <div v-if="importResults.failedCount > 0" class="rounded-md bg-red-50 p-4">
              <h4 class="text-sm font-medium text-red-800">Failed Imports ({{ importResults.failedCount }})</h4>
              <div class="mt-2 max-h-60 overflow-y-auto">
                <ul class="list-inside list-disc space-y-1 text-sm text-red-700">
                  <li v-for="(failed, idx) in importResults.results.failed" :key="idx">
                    Row {{ failed.index + 1 }}: {{ failed.username }} - {{ failed.error }}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <template #footer>
          <div class="flex gap-3">
            <button
              v-if="importStep === 'upload'"
              @click="closeImportModal"
              type="button"
              class="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              v-if="importStep === 'preview'"
              @click="importStep = 'upload'"
              type="button"
              class="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              Back
            </button>
            <button
              v-if="importStep === 'preview' && parsedData.isValid"
              @click="confirmImport"
              :disabled="importing"
              type="button"
              class="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span v-if="importing">Importing...</span>
              <span v-else>Confirm Import ({{ parsedData.data.length }} students)</span>
            </button>
            <button
              v-if="importStep === 'results'"
              @click="closeImportModal"
              type="button"
              class="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              Done
            </button>
          </div>
        </template>
      </modal>

      <!-- Delete Confirmation Dialog -->
      <confirm-dialog
        v-model="showDeleteConfirm"
        title="Delete Student"
        :message="`Are you sure you want to delete ${selectedStudent?.fullName}? This action cannot be undone.`"
        type="danger"
        confirm-text="Delete"
        cancel-text="Cancel"
        :loading="deleting"
        @confirm="confirmDelete"
      />
    </div>
  </admin-layout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import DataTable from '@/components/common/DataTable.vue'
import Modal from '@/components/common/Modal.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import CSVUploader from '@/components/common/CSVUploader.vue'
import { useUserManagement } from '@/composables/useUserManagement'
import { parseStudentCSV, generateStudentCSVTemplate, downloadCSVTemplate } from '@/utils/csvParser'
import type { Student, StudentFormData, ParsedCSVData, BulkCreateResult } from '@/types/user'
import type { TableColumn } from '@/components/common/DataTable.vue'

// Composable
const {
  users,
  loading,
  error,
  pagination,
  sortBy,
  sortOrder,
  searchQuery,
  fetchUsers,
  handlePageChange,
  handleSortChange,
  handleSearch,
  clearSearch: clearSearchQuery,
  deleteUser
} = useUserManagement<Student>('student')

// Table columns
const columns: TableColumn[] = [
  { key: 'studentId', label: 'Student ID', sortable: true },
  { key: 'fullName', label: 'Full Name', sortable: true },
  {
    key: 'class',
    label: 'Class',
    format: (value) => value?.name || '-'
  },
  {
    key: 'user',
    label: 'Email',
    format: (value) => value?.email || '-'
  },
  { key: 'phone', label: 'Phone', format: (value) => value || '-' },
  { key: 'isActive', label: 'Status' }
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

// Details Modal
const showDetailsModal = ref(false)
const selectedStudent = ref<Student | null>(null)

const openDetailsModal = (student: Student) => {
  selectedStudent.value = student
  isEditMode.value = false
  showDetailsModal.value = true
}

const formatDate = (date?: string) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString()
}

const formatDateForInput = (date?: string) => {
  if (!date) return ''
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Edit Mode
const isEditMode = ref(false)
const updating = ref(false)
const editForm = ref({
  username: '',
  email: '',
  studentId: '',
  fullName: '',
  classId: 0,
  phone: '',
  address: '',
  dateOfBirth: '',
  parentPhone: '',
  enrollmentDate: ''
})

const enableEditMode = () => {
  if (!selectedStudent.value) return

  // Populate edit form with current data
  editForm.value = {
    username: selectedStudent.value.user?.username || '',
    email: selectedStudent.value.user?.email || '',
    studentId: selectedStudent.value.studentId || '',
    fullName: selectedStudent.value.fullName || '',
    classId: selectedStudent.value.classId || 0,
    phone: selectedStudent.value.phone || '',
    address: selectedStudent.value.address || '',
    dateOfBirth: formatDateForInput(selectedStudent.value.dateOfBirth),
    parentPhone: selectedStudent.value.parentPhone || '',
    enrollmentDate: formatDateForInput(selectedStudent.value.enrollmentDate)
  }
  isEditMode.value = true
}

const cancelEdit = () => {
  isEditMode.value = false
}

const saveEdit = async () => {
  if (!selectedStudent.value?.userId) return

  updating.value = true
  const success = await useUserManagement('student').updateUser(
    selectedStudent.value.userId,
    editForm.value as any
  )
  updating.value = false

  if (success) {
    isEditMode.value = false
    showDetailsModal.value = false
    selectedStudent.value = null
  }
}

// Delete
const showDeleteConfirm = ref(false)
const deleting = ref(false)

const openDeleteConfirm = (student: Student) => {
  selectedStudent.value = student
  showDeleteConfirm.value = true
}

const confirmDelete = async () => {
  if (!selectedStudent.value?.userId) return

  deleting.value = true
  const success = await deleteUser(selectedStudent.value.userId)
  deleting.value = false

  if (success) {
    showDeleteConfirm.value = false
    selectedStudent.value = null
  }
}

// CSV Import
const showImportModal = ref(false)
const importStep = ref<'upload' | 'preview' | 'results'>('upload')
const parsedData = ref<ParsedCSVData<StudentFormData>>({
  data: [],
  errors: [],
  isValid: false
})
const importResults = ref<BulkCreateResult | null>(null)
const importing = ref(false)
const csvUploaderRef = ref<InstanceType<typeof CSVUploader> | null>(null)

const openImportModal = () => {
  showImportModal.value = true
  importStep.value = 'upload'
  parsedData.value = { data: [], errors: [], isValid: false }
  importResults.value = null
}

const closeImportModal = () => {
  showImportModal.value = false
  importStep.value = 'upload'
  parsedData.value = { data: [], errors: [], isValid: false }
  importResults.value = null
  csvUploaderRef.value?.removeFile()
}

const handleFileSelected = async (file: File) => {
  try {
    const result = await parseStudentCSV(file)
    parsedData.value = result
    importStep.value = 'preview'
  } catch (err: any) {
    error.value = err.message
  }
}

const confirmImport = async () => {
  importing.value = true
  const result = await useUserManagement('student').bulkCreateUsers(parsedData.value.data)
  importing.value = false

  if (result) {
    importResults.value = result
    importStep.value = 'results'
  }
}

const downloadTemplate = () => {
  const template = generateStudentCSVTemplate()
  downloadCSVTemplate(template, 'student_import_template.csv')
}

// Initialize
onMounted(() => {
  fetchUsers()
})
</script>
