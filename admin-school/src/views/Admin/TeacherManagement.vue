<template>
  <admin-layout>
    <div class="space-y-6">
      <!-- Header -->
      <div class="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Teacher Management</h1>
          <p class="mt-1 text-sm text-gray-500">Manage teacher accounts and information</p>
        </div>
        <div class="mt-4 sm:mt-0 flex gap-3">
          <button
            @click="openImportModal"
            type="button"
            class="inline-flex items-center gap-2.5 rounded-md border border-blue-600 bg-transparent px-4 py-2.5 text-center font-medium text-blue-600 hover:bg-blue-50 dark:border-blue-500 dark:text-blue-400 dark:hover:bg-blue-900/20"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Bulk Upload CSV
          </button>
          <button
            @click="openCreateModal"
            type="button"
            class="inline-flex items-center gap-2.5 rounded-md border border-blue-600 bg-blue-600 px-4 py-2.5 text-center font-medium text-white hover:bg-blue-700 dark:border-blue-500 dark:bg-blue-600 dark:text-white dark:hover:bg-blue-700"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Create Teacher
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
              placeholder="Search teachers by name, email, or teacher ID..."
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
        empty-message="No teachers found"
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
        :title="isEditMode ? 'Edit Teacher' : 'Teacher Details'"
        size="lg"
      >
        <div v-if="selectedTeacher" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">Teacher ID</label>
              <input
                v-if="isEditMode"
                v-model="editForm.teacherId"
                type="text"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
              <p v-else class="mt-1 text-sm text-gray-900">{{ selectedTeacher.teacherId }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Full Name</label>
              <input
                v-if="isEditMode"
                v-model="editForm.fullName"
                type="text"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
              <p v-else class="mt-1 text-sm text-gray-900">{{ selectedTeacher.fullName }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Username</label>
              <input
                v-if="isEditMode"
                v-model="editForm.username"
                type="text"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
              <p v-else class="mt-1 text-sm text-gray-900">{{ selectedTeacher.user?.username }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Email</label>
              <input
                v-if="isEditMode"
                v-model="editForm.email"
                type="email"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
              <p v-else class="mt-1 text-sm text-gray-900">{{ selectedTeacher.user?.email }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Phone</label>
              <input
                v-if="isEditMode"
                v-model="editForm.phone"
                type="text"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
              <p v-else class="mt-1 text-sm text-gray-900">{{ selectedTeacher.phone || '-' }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Hire Date</label>
              <input
                v-if="isEditMode"
                v-model="editForm.hireDate"
                type="date"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
              <p v-else class="mt-1 text-sm text-gray-900">{{ formatDate(selectedTeacher.hireDate) }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Status</label>
              <p class="mt-1 text-sm text-gray-900">{{ selectedTeacher.user?.isActive ? 'Active' : 'Inactive' }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Created At</label>
              <p class="mt-1 text-sm text-gray-900">{{ formatDate(selectedTeacher.createdAt) }}</p>
            </div>
            <div class="col-span-2">
              <label class="block text-sm font-medium text-gray-700">Address</label>
              <textarea
                v-if="isEditMode"
                v-model="editForm.address"
                rows="2"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              ></textarea>
              <p v-else class="mt-1 text-sm text-gray-900">{{ selectedTeacher.address || '-' }}</p>
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

      <!-- Create Teacher Modal -->
      <modal
        v-model="showCreateModal"
        title="Create New Teacher"
        size="lg"
      >
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <!-- Username -->
            <div class="col-span-2">
              <label class="block text-sm font-medium text-gray-700">Username <span class="text-red-500">*</span></label>
              <input
                v-model="createForm.username"
                type="text"
                placeholder="e.g., john.doe"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
              <p v-if="createErrors.username" class="mt-1 text-xs text-red-600">{{ createErrors.username }}</p>
            </div>

            <!-- Email -->
            <div class="col-span-2">
              <label class="block text-sm font-medium text-gray-700">Email <span class="text-red-500">*</span></label>
              <input
                v-model="createForm.email"
                type="email"
                placeholder="e.g., john.doe@example.com"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
              <p v-if="createErrors.email" class="mt-1 text-xs text-red-600">{{ createErrors.email }}</p>
            </div>

            <!-- Password -->
            <div class="col-span-2">
              <label class="block text-sm font-medium text-gray-700">Password <span class="text-red-500">*</span></label>
              <input
                v-model="createForm.password"
                type="password"
                placeholder="Minimum 6 characters"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
              <p v-if="createErrors.password" class="mt-1 text-xs text-red-600">{{ createErrors.password }}</p>
            </div>

            <!-- Teacher ID -->
            <div>
              <label class="block text-sm font-medium text-gray-700">Teacher ID <span class="text-red-500">*</span></label>
              <input
                v-model="createForm.teacherId"
                type="text"
                placeholder="e.g., TCH001"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
              <p v-if="createErrors.teacherId" class="mt-1 text-xs text-red-600">{{ createErrors.teacherId }}</p>
            </div>

            <!-- Full Name -->
            <div>
              <label class="block text-sm font-medium text-gray-700">Full Name <span class="text-red-500">*</span></label>
              <input
                v-model="createForm.fullName"
                type="text"
                placeholder="e.g., John Doe"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
              <p v-if="createErrors.fullName" class="mt-1 text-xs text-red-600">{{ createErrors.fullName }}</p>
            </div>

            <!-- Phone (Optional) -->
            <div>
              <label class="block text-sm font-medium text-gray-700">Phone</label>
              <input
                v-model="createForm.phone"
                type="tel"
                placeholder="e.g., +62812345678"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>

            <!-- Hire Date (Optional) -->
            <div>
              <label class="block text-sm font-medium text-gray-700">Hire Date</label>
              <input
                v-model="createForm.hireDate"
                type="date"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>

            <!-- Address (Optional, Full Width) -->
            <div class="col-span-2">
              <label class="block text-sm font-medium text-gray-700">Address</label>
              <textarea
                v-model="createForm.address"
                rows="2"
                placeholder="Teacher's residential address"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              ></textarea>
            </div>
          </div>
        </div>

        <template #footer>
          <div class="flex gap-3">
            <button
              @click="submitCreateForm"
              :disabled="creating"
              type="button"
              class="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ creating ? 'Creating...' : 'Create Teacher' }}
            </button>
            <button
              @click="closeCreateModal"
              type="button"
              class="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </template>
      </modal>

      <!-- Import CSV Modal -->
      <modal
        v-model="showImportModal"
        title="Import Teachers from CSV"
        size="2xl"
      >
        <div class="space-y-4">
          <!-- Step 1: Upload CSV -->
          <div v-if="importStep === 'upload'">
            <p class="mb-4 text-sm text-gray-600 dark:text-gray-400">
              Upload a CSV file to create multiple teacher accounts at once.
            </p>

            <div class="mb-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
              <p class="mb-2 text-sm font-medium text-gray-900 dark:text-white">Required columns:</p>
              <code class="text-xs text-gray-800 dark:text-gray-200">
                username, email, password, teacherId, fullName
              </code>
              <p class="mt-3 text-sm font-medium text-gray-900 dark:text-white">Optional columns:</p>
              <code class="text-xs text-gray-800 dark:text-gray-200">
                phone, address, hireDate (YYYY-MM-DD)
              </code>
              <button
                @click="downloadTemplate"
                type="button"
                class="mt-3 text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
              >
                Download CSV Template
              </button>
            </div>

            <!-- File Upload -->
            <div class="space-y-3">
              <input
                ref="csvFileInput"
                type="file"
                accept=".csv"
                @change="handleCsvFileSelected"
                class="hidden"
              />
              <button
                @click="csvFileInput?.click()"
                type="button"
                class="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Choose CSV File
              </button>
              <div v-if="csvFile" class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <svg class="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{{ csvFile.name }}</span>
                <button
                  @click="csvFile = null; if (csvFileInput) csvFileInput.value = ''"
                  type="button"
                  class="text-red-600 hover:text-red-700"
                >
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <!-- Error Display -->
            <div v-if="csvError" class="mt-4 rounded-md bg-red-50 p-4 dark:bg-red-900/20">
              <div class="flex">
                <div class="flex-shrink-0">
                  <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                  </svg>
                </div>
                <div class="ml-3 flex-1">
                  <h3 class="text-sm font-medium text-red-800 dark:text-red-200">
                    {{ csvError }}
                  </h3>
                  <div v-if="csvValidationErrors.length > 0" class="mt-2 text-sm text-red-700 dark:text-red-300">
                    <div class="max-h-60 overflow-y-auto">
                      <ul class="list-inside list-disc space-y-1">
                        <li v-for="(error, index) in csvValidationErrors" :key="index" class="text-xs">
                          {{ error }}
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
                    Successfully parsed {{ parsedData.data.length }} teacher(s). Ready to import!
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
                    <th class="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Teacher ID</th>
                    <th class="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Email</th>
                    <th class="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Phone</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200 bg-white">
                  <tr v-for="(teacher, idx) in parsedData.data" :key="idx">
                    <td class="whitespace-nowrap px-4 py-2 text-sm text-gray-900">{{ teacher.username }}</td>
                    <td class="whitespace-nowrap px-4 py-2 text-sm text-gray-900">{{ teacher.fullName }}</td>
                    <td class="whitespace-nowrap px-4 py-2 text-sm text-gray-900">{{ teacher.teacherId }}</td>
                    <td class="whitespace-nowrap px-4 py-2 text-sm text-gray-900">{{ teacher.email }}</td>
                    <td class="whitespace-nowrap px-4 py-2 text-sm text-gray-900">{{ teacher.phone || '-' }}</td>
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
              @click="processCsvFile"
              :disabled="!csvFile || processingCsv"
              type="button"
              class="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {{ processingCsv ? 'Processing...' : 'Preview' }}
            </button>
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
              <span v-else>Confirm Import ({{ parsedData.data.length }} teachers)</span>
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
        title="Delete Teacher"
        :message="`Are you sure you want to delete ${selectedTeacher?.fullName}? This action cannot be undone.`"
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
import Papa from 'papaparse'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import DataTable from '@/components/common/DataTable.vue'
import Modal from '@/components/common/Modal.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import { useUserManagement } from '@/composables/useUserManagement'
import { generateTeacherCSVTemplate, downloadCSVTemplate } from '@/utils/csvParser'
import type { Teacher, TeacherFormData, ParsedCSVData, BulkCreateResult } from '@/types/user'
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
  deleteUser,
  createUser,
  bulkCreateUsers,
  updateUser
} = useUserManagement<Teacher>('teacher')

// Table columns
const columns: TableColumn[] = [
  { key: 'teacherId', label: 'Teacher ID', sortable: true },
  { key: 'fullName', label: 'Full Name', sortable: true },
  {
    key: 'user',
    label: 'Email',
    format: (value) => value?.email || '-'
  },
  { key: 'phone', label: 'Phone', format: (value) => value || '-' },
  {
    key: 'hireDate',
    label: 'Hire Date',
    format: (value) => (value ? new Date(value).toLocaleDateString() : '-')
  },
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
const selectedTeacher = ref<Teacher | null>(null)

const openDetailsModal = (teacher: Teacher) => {
  selectedTeacher.value = teacher
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
  teacherId: '',
  fullName: '',
  phone: '',
  address: '',
  hireDate: ''
})

const enableEditMode = () => {
  if (!selectedTeacher.value) return

  // Populate edit form with current data
  editForm.value = {
    username: selectedTeacher.value.user?.username || '',
    email: selectedTeacher.value.user?.email || '',
    teacherId: selectedTeacher.value.teacherId || '',
    fullName: selectedTeacher.value.fullName || '',
    phone: selectedTeacher.value.phone || '',
    address: selectedTeacher.value.address || '',
    hireDate: formatDateForInput(selectedTeacher.value.hireDate)
  }
  isEditMode.value = true
}

const cancelEdit = () => {
  isEditMode.value = false
}

const saveEdit = async () => {
  if (!selectedTeacher.value?.userId) return

  updating.value = true
  const success = await useUserManagement('teacher').updateUser(
    selectedTeacher.value.userId,
    editForm.value as any
  )
  updating.value = false

  if (success) {
    isEditMode.value = false
    showDetailsModal.value = false
    selectedTeacher.value = null
  }
}

// Delete
const showDeleteConfirm = ref(false)
const deleting = ref(false)

const openDeleteConfirm = (teacher: Teacher) => {
  selectedTeacher.value = teacher
  showDeleteConfirm.value = true
}

const confirmDelete = async () => {
  if (!selectedTeacher.value?.userId) return

  deleting.value = true
  const success = await deleteUser(selectedTeacher.value.userId)
  deleting.value = false

  if (success) {
    showDeleteConfirm.value = false
    selectedTeacher.value = null
  }
}

// Create Modal
const showCreateModal = ref(false)
const creating = ref(false)
const createErrors = ref<Partial<Record<keyof TeacherFormData, string>>>({})
const createForm = ref<TeacherFormData>({
  username: '',
  email: '',
  password: '',
  role: 'teacher',
  teacherId: '',
  fullName: '',
  phone: '',
  address: '',
  hireDate: ''
})

const validateCreateForm = (): boolean => {
  createErrors.value = {}
  let isValid = true

  // Username validation
  if (!createForm.value.username || createForm.value.username.length < 3) {
    createErrors.value.username = 'Username must be at least 3 characters'
    isValid = false
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!createForm.value.email || !emailRegex.test(createForm.value.email)) {
    createErrors.value.email = 'Please enter a valid email'
    isValid = false
  }

  // Password validation
  if (!createForm.value.password || createForm.value.password.length < 6) {
    createErrors.value.password = 'Password must be at least 6 characters'
    isValid = false
  }

  // Teacher ID validation
  if (!createForm.value.teacherId) {
    createErrors.value.teacherId = 'Teacher ID is required'
    isValid = false
  }

  // Full Name validation
  if (!createForm.value.fullName) {
    createErrors.value.fullName = 'Full Name is required'
    isValid = false
  }

  return isValid
}

const openCreateModal = () => {
  resetCreateForm()
  showCreateModal.value = true
}

const closeCreateModal = () => {
  showCreateModal.value = false
  resetCreateForm()
}

const resetCreateForm = () => {
  createForm.value = {
    username: '',
    email: '',
    password: '',
    role: 'teacher',
    teacherId: '',
    fullName: '',
    phone: '',
    address: '',
    hireDate: ''
  }
  createErrors.value = {}
}

const submitCreateForm = async () => {
  if (!validateCreateForm()) {
    return
  }

  creating.value = true
  try {
    const success = await createUser(createForm.value)

    if (success) {
      showCreateModal.value = false
      resetCreateForm()
    } else {
      // Error message already set in error ref from composable
      createErrors.value.email = error.value || 'Failed to create teacher'
    }
  } catch (err) {
    console.error('Error creating teacher:', err)
    createErrors.value.email = 'An error occurred while creating the teacher'
  } finally {
    creating.value = false
  }
}

// CSV Import
const showImportModal = ref(false)
const importStep = ref<'upload' | 'preview' | 'results'>('upload')
const parsedData = ref<ParsedCSVData<TeacherFormData>>({
  data: [],
  errors: [],
  isValid: false
})
const importResults = ref<BulkCreateResult | null>(null)
const importing = ref(false)
const csvFileInput = ref<HTMLInputElement | null>(null)
const csvFile = ref<File | null>(null)
const csvError = ref<string | null>(null)
const csvValidationErrors = ref<string[]>([])
const processingCsv = ref(false)

const openImportModal = () => {
  showImportModal.value = true
  importStep.value = 'upload'
  parsedData.value = { data: [], errors: [], isValid: false }
  importResults.value = null
  csvFile.value = null
  csvError.value = null
  csvValidationErrors.value = []
}

const closeImportModal = () => {
  showImportModal.value = false
  importStep.value = 'upload'
  parsedData.value = { data: [], errors: [], isValid: false }
  importResults.value = null
  csvFile.value = null
  csvError.value = null
  csvValidationErrors.value = []
}

const handleCsvFileSelected = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) {
    csvFile.value = file
    csvError.value = null
    csvValidationErrors.value = []
  }
}

const processCsvFile = async () => {
  if (!csvFile.value) return

  processingCsv.value = true
  csvError.value = null
  csvValidationErrors.value = []

  try {
    // Parse CSV file
    Papa.parse(csvFile.value, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      complete: (results) => {
        const validationErrors: string[] = []
        const data: TeacherFormData[] = []

        // Required fields
        const requiredFields = ['username', 'email', 'password', 'teacherId', 'fullName']

        // Validate headers
        const headers = results.meta.fields || []
        const missingHeaders = requiredFields.filter(f => !headers.includes(f))

        if (missingHeaders.length > 0) {
          csvError.value = `Missing required columns: ${missingHeaders.join(', ')}`
          csvValidationErrors.value = [
            'Required CSV format:',
            'username, email, password, teacherId, fullName, phone, address, hireDate',
            '',
            `Missing: ${missingHeaders.join(', ')}`
          ]
          processingCsv.value = false
          return
        }

        if (results.data.length === 0) {
          csvError.value = 'CSV file has no data rows'
          processingCsv.value = false
          return
        }

        // Validate each row
        results.data.forEach((row: any, index: number) => {
          const rowNumber = index + 2
          const errors: string[] = []

          // Validate username
          if (!row.username || row.username.trim() === '') {
            errors.push('username is required')
          }

          // Validate email
          if (!row.email || row.email.trim() === '') {
            errors.push('email is required')
          } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
            errors.push(`email "${row.email}" has invalid format`)
          }

          // Validate password
          if (!row.password || row.password.trim() === '') {
            errors.push('password is required')
          }

          // Validate teacherId
          if (!row.teacherId || row.teacherId.trim() === '') {
            errors.push('teacherId is required')
          }

          // Validate fullName
          if (!row.fullName || row.fullName.trim() === '') {
            errors.push('fullName is required')
          }

          // Validate optional date field
          if (row.hireDate && row.hireDate.trim() !== '') {
            if (!/^\d{4}-\d{2}-\d{2}$/.test(row.hireDate)) {
              errors.push(`hireDate "${row.hireDate}" has invalid format. Expected YYYY-MM-DD`)
            }
          }

          // Validate phone number
          if (row.phone && row.phone.trim() !== '' && !/^[0-9+\s()-]{8,20}$/.test(row.phone)) {
            errors.push(`phone "${row.phone}" has invalid format`)
          }

          // Add errors to validation list
          if (errors.length > 0) {
            validationErrors.push(`Row ${rowNumber}: ${errors.join('; ')}`)
          } else {
            // Add to data if valid
            data.push({
              username: row.username.trim(),
              email: row.email.trim(),
              password: row.password.trim(),
              role: 'teacher',
              teacherId: row.teacherId.trim(),
              fullName: row.fullName.trim(),
              phone: row.phone?.trim() || undefined,
              address: row.address?.trim() || undefined,
              hireDate: row.hireDate?.trim() || undefined
            })
          }
        })

        csvValidationErrors.value = validationErrors

        if (validationErrors.length > 0) {
          csvError.value = `Found ${validationErrors.length} validation error(s). Please fix the issues and try again.`
          processingCsv.value = false
          return
        }

        // Success - move to preview
        parsedData.value = {
          data,
          errors: [],
          isValid: true
        }
        importStep.value = 'preview'
        processingCsv.value = false
      },
      error: (error) => {
        csvError.value = 'Failed to parse CSV file: ' + error.message
        csvValidationErrors.value = ['Make sure the file is a valid CSV format with comma-separated values']
        processingCsv.value = false
      }
    })
  } catch (err: any) {
    csvError.value = 'Failed to parse CSV file: ' + err.message
    csvValidationErrors.value = ['Make sure the file is a valid CSV format with comma-separated values']
    processingCsv.value = false
  }
}

const confirmImport = async () => {
  importing.value = true
  const result = await useUserManagement('teacher').bulkCreateUsers(parsedData.value.data)
  importing.value = false

  if (result) {
    importResults.value = result
    importStep.value = 'results'
  }
}

const downloadTemplate = () => {
  const template = generateTeacherCSVTemplate()
  downloadCSVTemplate(template, 'teacher_import_template.csv')
}

// Initialize
onMounted(() => {
  fetchUsers()
})
</script>
