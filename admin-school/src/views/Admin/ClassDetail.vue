<template>
  <admin-layout>
    <div class="mx-auto max-w-7xl">
      <!-- Header with Back Button -->
      <div class="mb-6 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <button
            @click="goBack"
            type="button"
            class="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Classes
          </button>
        </div>
        <h2 class="text-title-md2 font-bold text-gray-900 dark:text-white">
          Edit Class
        </h2>
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

      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center py-12">
        <div class="text-gray-500 dark:text-gray-400">Loading...</div>
      </div>

      <!-- Class Edit Form -->
      <div v-else-if="formData" class="space-y-6">
        <!-- Class Information Form Card -->
        <div class="rounded-sm border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-6">
          <div class="mb-6">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Class Information</h3>
          </div>

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

            <div class="flex gap-3 pt-4">
              <button
                type="submit"
                :disabled="submitting || !isFormValid"
                class="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ submitting ? 'Updating...' : 'Update Class' }}
              </button>
              <button
                @click="goBack"
                type="button"
                class="rounded-md bg-white dark:bg-gray-800 px-4 py-2 text-sm font-semibold text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        <!-- Students Card -->
        <div class="rounded-sm border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-6">
          <h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Students ({{ classData?.studentCount || 0 }})
          </h3>

          <div v-if="classData?.students && classData.students.length > 0" class="space-y-3">
            <div
              v-for="student in classData.students"
              :key="student.id"
              class="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4"
            >
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ student.fullName }}
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    Student ID: {{ student.studentId }}
                  </p>
                </div>
              </div>
            </div>
            <p v-if="classData.studentCount > classData.students.length" class="text-xs text-gray-500 dark:text-gray-400 text-center pt-2">
              Showing {{ classData.students.length }} of {{ classData.studentCount }} students
            </p>
          </div>
          <div v-else class="text-center py-8">
            <p class="text-sm text-gray-500 dark:text-gray-400">No students in this class</p>
          </div>
        </div>

        <!-- Schedules Card -->
        <div class="rounded-sm border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-6">
          <h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Schedules ({{ classData?.scheduleCount || 0 }})
          </h3>

          <div v-if="classData?.schedules && classData.schedules.length > 0" class="space-y-3">
            <div
              v-for="schedule in classData.schedules"
              :key="schedule.id"
              class="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4"
            >
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ schedule.subject }}
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    Teacher: {{ schedule.teacher }}
                  </p>
                </div>
                <div class="text-right">
                  <p class="text-sm text-gray-900 dark:text-white">
                    {{ getDayName(schedule.dayOfWeek) }}
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    {{ formatTime(schedule.startTime) }} - {{ formatTime(schedule.endTime) }}
                  </p>
                </div>
              </div>
            </div>
            <p v-if="classData.scheduleCount > classData.schedules.length" class="text-xs text-gray-500 dark:text-gray-400 text-center pt-2">
              Showing {{ classData.schedules.length }} of {{ classData.scheduleCount }} schedules
            </p>
          </div>
          <div v-else class="text-center py-8">
            <p class="text-sm text-gray-500 dark:text-gray-400">No schedules for this class</p>
          </div>
        </div>
      </div>
    </div>
  </admin-layout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import classService from '@/services/class.service'
import academicPeriodService from '@/services/academicPeriod.service'
import userManagementService from '@/services/userManagement.service'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import type { ClassDetailsResponse, ClassFormData, SchoolLevel } from '@/types/class'
import type { AcademicPeriod } from '@/types/academicPeriod'
import type { Teacher } from '@/types/user'

const route = useRoute()
const router = useRouter()

const classData = ref<ClassDetailsResponse | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const successMessage = ref<string | null>(null)
const submitting = ref(false)

// Form data
const formData = ref<ClassFormData>({
  name: '',
  schoolLevelId: 0,
  gradeLevel: 0,
  academicPeriodId: 0,
  homeroomTeacherId: null
})

// Dropdown data
const schoolLevels = ref<SchoolLevel[]>([
  { id: 1, name: 'SD', description: 'Elementary (Grade 1-6)' },
  { id: 2, name: 'SMP', description: 'Junior High (Grade 7-9)' },
  { id: 3, name: 'SMA', description: 'Senior High (Grade 10-12)' }
])
const academicPeriods = ref<AcademicPeriod[]>([])
const teachers = ref<Teacher[]>([])

// Form validation
const isFormValid = computed(() => {
  return formData.value.name.trim() !== '' &&
    formData.value.schoolLevelId > 0 &&
    formData.value.gradeLevel >= 1 &&
    formData.value.gradeLevel <= 12 &&
    formData.value.academicPeriodId > 0
})

// Auto-dismiss success message
const showSuccessMessage = (message: string) => {
  successMessage.value = message
  setTimeout(() => {
    successMessage.value = null
  }, 5000)
}

// Load dropdown data
const loadDropdownData = async () => {
  try {
    // Load academic periods
    const periodsResponse = await academicPeriodService.getAcademicPeriods({
      limit: 100,
      sortBy: 'startDate',
      sortOrder: 'desc'
    })
    academicPeriods.value = periodsResponse.academicPeriods

    // Load teachers
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

const fetchClassDetails = async () => {
  const classId = Number(route.params.classId)
  if (isNaN(classId)) {
    error.value = 'Invalid class ID'
    return
  }

  try {
    loading.value = true
    error.value = null
    classData.value = await classService.getClassById(classId)

    // Populate form data
    if (classData.value) {
      const schoolLevel = schoolLevels.value.find(sl => sl.name === classData.value?.schoolLevel)
      const period = academicPeriods.value.find(p => p.name === classData.value?.academicPeriod.name)
      const teacher = teachers.value.find(t => t.fullName === classData.value?.homeroomTeacher?.fullName)

      formData.value = {
        name: classData.value.name,
        schoolLevelId: schoolLevel?.id || 0,
        gradeLevel: classData.value.gradeLevel,
        academicPeriodId: period?.id || 0,
        homeroomTeacherId: teacher?.userId || null
      }
    }
  } catch (err: any) {
    error.value = err.response?.data?.errors || err.message || 'Failed to fetch class details'
  } finally {
    loading.value = false
  }
}

const handleSubmit = async () => {
  if (!isFormValid.value) return

  const classId = Number(route.params.classId)
  if (isNaN(classId)) return

  try {
    submitting.value = true
    error.value = null

    await classService.updateClass(classId, formData.value)
    showSuccessMessage('Class updated successfully!')

    // Refresh class data
    await fetchClassDetails()
  } catch (err: any) {
    error.value = err.response?.data?.errors || err.response?.data?.message || err.message || 'Failed to update class'
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } finally {
    submitting.value = false
  }
}

const goBack = () => {
  router.push('/admin/academic/class')
}

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

onMounted(async () => {
  await loadDropdownData()
  await fetchClassDetails()
})
</script>
