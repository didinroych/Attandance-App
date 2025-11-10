<template>
  <admin-layout>
    <div class="space-y-6">
      <!-- Dashboard Statistics -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-4">
        <MetricCard
          label="Total Students"
          :value="statistics.totalStudents"
          :loading="loading"
          :icon="UserGroupIcon"
        />

        <MetricCard
          label="Total Teachers"
          :value="statistics.totalTeachers"
          :loading="loading"
          :icon="UserCircleIcon"
        />

        <MetricCard
          label="Total Classes"
          :value="statistics.totalClasses"
          :loading="loading"
          :icon="GridIcon"
        />

        <MetricCard
          label="Total Subjects"
          :value="statistics.totalSubjects"
          :loading="loading"
          :icon="DocsIcon"
        />
      </div>

      <!-- Error Display -->
      <div v-if="error" class="p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
        <p class="text-sm text-red-600 dark:text-red-400">{{ error }}</p>
      </div>
    </div>
  </admin-layout>
</template>

<script setup lang="ts">
import AdminLayout from '@/components/layout/AdminLayout.vue'
import MetricCard from '@/components/common/MetricCard.vue'
import { useDashboard } from '@/composables/useDashboard'
import UserGroupIcon from '@/icons/UserGroupIcon.vue'
import UserCircleIcon from '@/icons/UserCircleIcon.vue'
import GridIcon from '@/icons/GridIcon.vue'
import DocsIcon from '@/icons/DocsIcon.vue'

const { statistics, loading, error } = useDashboard()
</script>
