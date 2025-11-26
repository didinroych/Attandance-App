<template>
  <div class="overflow-hidden bg-white dark:bg-gray-800 shadow sm:rounded-lg">
    <!-- Table -->
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th
              v-for="column in columns"
              :key="column.key"
              scope="col"
              class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300"
              :class="{ 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600': column.sortable }"
              @click="column.sortable ? handleSort(column.key) : null"
            >
              <div class="flex items-center gap-2">
                <span>{{ column.label }}</span>
                <span v-if="column.sortable && sortBy === column.key" class="text-gray-400 dark:text-gray-400">
                  {{ sortOrder === 'asc' ? '↑' : '↓' }}
                </span>
              </div>
            </th>
            <th
              v-if="hasActions"
              scope="col"
              class="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300"
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
          <tr v-if="loading">
            <td :colspan="columns.length + (hasActions ? 1 : 0)" class="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
              Loading...
            </td>
          </tr>
          <tr v-else-if="data.length === 0">
            <td :colspan="columns.length + (hasActions ? 1 : 0)" class="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
              {{ emptyMessage }}
            </td>
          </tr>
          <tr v-else v-for="(row, index) in data" :key="index" class="hover:bg-gray-50 dark:hover:bg-gray-700">
            <td
              v-for="column in columns"
              :key="column.key"
              class="px-6 py-4 text-sm text-gray-900 dark:text-gray-100"
              :class="column.nowrap !== false ? 'whitespace-nowrap' : ''"
            >
              <slot :name="`cell-${column.key}`" :row="row" :value="row[column.key]">
                <span v-if="column.format" v-html="formatCell(row, column)"></span>
                <span v-else>{{ formatCell(row, column) }}</span>
              </slot>
            </td>
            <td v-if="hasActions" class="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
              <slot name="actions" :row="row"></slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div
      v-if="pagination && !loading"
      class="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 sm:px-6"
    >
      <div class="flex flex-1 justify-between sm:hidden">
        <button
          @click="$emit('page-change', pagination.currentPage - 1)"
          :disabled="!pagination.hasPreviousPage"
          class="relative inline-flex items-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Previous
        </button>
        <button
          @click="$emit('page-change', pagination.currentPage + 1)"
          :disabled="!pagination.hasNextPage"
          class="relative ml-3 inline-flex items-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>
            <div class="flex items-center gap-2">
        <label class="text-sm text-gray-700 dark:text-gray-300">Show:</label>
        <select
          v-model="pageLimit"
          @change="handleLimitChange"
          class="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option :value="10">10</option>
          <option :value="25">25</option>
          <option :value="50">50</option>
        </select>
        <span class="text-sm text-gray-700 dark:text-gray-300">per page</span>
      </div>
      <div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p class="text-sm text-gray-700 dark:text-gray-300">
            Showing
            <span class="font-medium">{{ ((pagination.currentPage - 1) * pagination.limit) + 1 }}</span>
            to
            <span class="font-medium">{{
              Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)
            }}</span>
            of
            <span class="font-medium">{{ pagination.totalCount }}</span>
            results
          </p>
        </div>
        <div>
          <nav class="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
            <button
              @click="$emit('page-change', pagination.currentPage - 1)"
              :disabled="!pagination.hasPreviousPage"
              class="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 dark:text-gray-400 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 focus:z-20 focus:outline-offset-0 disabled:cursor-not-allowed disabled:opacity-50 bg-white dark:bg-gray-800"
            >
              <span class="sr-only">Previous</span>
              <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path
                  fill-rule="evenodd"
                  d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                  clip-rule="evenodd"
                />
              </svg>
            </button>

            <template v-for="page in displayPages" :key="page">
              <button
                v-if="page !== '...'"
                @click="typeof page === 'number' && $emit('page-change', page)"
                :class="[
                  page === pagination.currentPage
                    ? 'z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                    : 'text-gray-900 dark:text-gray-300 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-offset-0 bg-white dark:bg-gray-800',
                  'relative inline-flex items-center px-4 py-2 text-sm font-semibold focus:z-20'
                ]"
              >
                {{ page }}
              </button>
              <span
                v-else
                class="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-400 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 focus:outline-offset-0 bg-white dark:bg-gray-800"
              >
                ...
              </span>
            </template>

            <button
              @click="$emit('page-change', pagination.currentPage + 1)"
              :disabled="!pagination.hasNextPage"
              class="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 dark:text-gray-400 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 focus:z-20 focus:outline-offset-0 disabled:cursor-not-allowed disabled:opacity-50 bg-white dark:bg-gray-800"
            >
              <span class="sr-only">Next</span>
              <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path
                  fill-rule="evenodd"
                  d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                  clip-rule="evenodd"
                />
              </svg>
            </button>
          </nav>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { PaginationMeta } from '@/types/user'

export interface TableColumn {
  key: string
  label: string
  sortable?: boolean
  nowrap?: boolean
  format?: (value: any, row: any) => string
}

interface Props {
  columns: TableColumn[]
  data: any[]
  loading?: boolean
  pagination?: PaginationMeta
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  hasActions?: boolean
  emptyMessage?: string
  initialLimit?: number
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  sortBy: '',
  sortOrder: 'asc',
  hasActions: false,
  emptyMessage: 'No data available',
  initialLimit: 10
})

const emit = defineEmits<{
  'sort-change': [{ key: string; order: 'asc' | 'desc' }]
  'page-change': [page: number]
  'limit-change': [limit: number]
}>()

const pageLimit = ref(props.initialLimit)

// Watch for changes in pagination prop to sync pageLimit
watch(
  () => props.pagination?.limit,
  (newLimit) => {
    if (newLimit !== undefined && newLimit !== pageLimit.value) {
      pageLimit.value = newLimit
    }
  }
)

const handleSort = (key: string) => {
  const newOrder = props.sortBy === key && props.sortOrder === 'asc' ? 'desc' : 'asc'
  emit('sort-change', { key, order: newOrder })
}

const handleLimitChange = () => {
  emit('limit-change', pageLimit.value)
}

// Helper to access nested properties (e.g., "class.name")
const getNestedValue = (obj: any, path: string): any => {
  return path.split('.').reduce((current, prop) => current?.[prop], obj)
}

const formatCell = (row: any, column: TableColumn) => {
  const value = column.key.includes('.')
    ? getNestedValue(row, column.key)
    : row[column.key]

  if (column.format) {
    return column.format(value, row)
  }
  return value ?? '-'
}

const displayPages = computed(() => {
  if (!props.pagination) return []

  const { currentPage, totalPages } = props.pagination
  const pages: (number | string)[] = []
  const maxVisible = 7

  if (totalPages <= maxVisible) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i)
    }
  } else {
    if (currentPage <= 3) {
      for (let i = 1; i <= 5; i++) pages.push(i)
      pages.push('...')
      pages.push(totalPages)
    } else if (currentPage >= totalPages - 2) {
      pages.push(1)
      pages.push('...')
      for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      pages.push('...')
      for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i)
      pages.push('...')
      pages.push(totalPages)
    }
  }

  return pages
})
</script>
