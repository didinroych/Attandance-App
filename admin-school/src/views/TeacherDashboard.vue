<template>
  <div class="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-50 dark:bg-gray-900">
    <div class="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
      <div class="mb-6">
        <svg
          class="w-20 h-20 mx-auto text-brand-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
      </div>
      <h1 class="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
        Teacher Dashboard
      </h1>
      <p class="mb-6 text-gray-600 dark:text-gray-400">
        This section is currently under development. Check back soon!
      </p>
      <div class="flex flex-col gap-3">
        <button
          @click="handleLogout"
          class="px-4 py-2 text-sm font-medium text-white transition rounded-lg bg-brand-500 hover:bg-brand-600"
        >
          Logout
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuth } from '@/composables/useAuth'

const { logout } = useAuth()

const handleLogout = async () => {
  console.log('🟢 [TeacherDashboard] Logout button clicked')
  await logout()
  console.log('🟢 [TeacherDashboard] logout() completed')
}
</script>
