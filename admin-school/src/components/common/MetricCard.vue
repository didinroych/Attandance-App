<!-- src/components/common/MetricCard.vue -->
<template>
  <div class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
    <!-- Icon -->
    <div class="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
      <component :is="icon" v-if="icon" class="text-gray-800 dark:text-white/90" />
    </div>

    <!-- Content -->
    <div class="flex items-end justify-between mt-5">
      <div>
        <span class="text-sm text-gray-500 dark:text-gray-400">{{ label }}</span>
        <h4 class="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
          {{ loading ? '...' : value }}
        </h4>
      </div>

      <span
        v-if="percentage"
        :class="[
          'flex items-center gap-1 rounded-full py-0.5 pl-2 pr-2.5 text-sm font-medium',
          trend === 'up'
            ? 'bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500'
            : 'bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500'
        ]"
      >
        <!-- Arrow icon based on trend -->
        <svg class="fill-current" width="12" height="12" viewBox="0 0 12 12">
          <path v-if="trend === 'up'" d="M5.56462 1.62393C5.70193 1.47072 5.90135 1.37432 6.12329 1.37432..." />
          <path v-else d="M5.31462 10.3761C5.45194 10.5293 5.65136 10.6257..." />
        </svg>
        {{ percentage }}
      </span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  label: String,
  value: [String, Number],
  percentage: String,
  trend: {
    type: String,
    default: 'up'
  },
  loading: Boolean,
  icon: Object
})
</script>