<!-- src/components/school/SchoolMetrics.vue -->
<template>
  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-4">
    <MetricCard 
      label="Students" 
      :value="metrics.students"
      :loading="loading"
    >
      <template #icon>
        <!-- Student Icon SVG -->
        <svg class="fill-gray-800 dark:fill-white/90" width="24" height="24">...</svg>
      </template>
    </MetricCard>

    <MetricCard 
      label="Teachers" 
      :value="metrics.teachers"
      :loading="loading"
    >
      <template #icon>
        <!-- Teacher Icon SVG -->
        <svg class="fill-gray-800 dark:fill-white/90" width="24" height="24">...</svg>
      </template>
    </MetricCard>

    <MetricCard 
      label="Classes" 
      :value="metrics.classes"
      :loading="loading"
    >
      <template #icon>
        <!-- Class Icon SVG -->
        <svg class="fill-gray-800 dark:fill-white/90" width="24" height="24">...</svg>
      </template>
    </MetricCard>

    <MetricCard 
      label="Subjects" 
      :value="metrics.subjects"
      :loading="loading"
    >
      <template #icon>
        <!-- Subject Icon SVG -->
        <svg class="fill-gray-800 dark:fill-white/90" width="24" height="24">...</svg>
      </template>
    </MetricCard>
  </div>
</template>

<script setup>
import MetricCard from '../common/MetricCard.vue'
import { useSchoolMetrics } from '@/composables/useSchoolMetrics'

const { metrics, loading } = useSchoolMetrics()
</script>