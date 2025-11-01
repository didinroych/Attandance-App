<template>
  <FullScreenLayout>
    <div class="relative p-6 bg-white z-1 dark:bg-gray-900 sm:p-0">
      <div
        class="relative flex flex-col justify-center w-full h-screen lg:flex-row dark:bg-gray-900"
      >
        <div class="flex flex-col flex-1 w-full lg:w-1/2">
          <div class="w-full max-w-md pt-10 mx-auto">
            <router-link
              to="/forgot-password"
              class="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              <svg
                class="stroke-current"
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
              >
                <path
                  d="M12.7083 5L7.5 10.2083L12.7083 15.4167"
                  stroke=""
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              Back
            </router-link>
          </div>
          <div class="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
            <div>
              <div class="mb-5 sm:mb-8">
                <h1
                  class="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md"
                >
                  Verify OTP
                </h1>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  Enter the 6-digit code sent to {{ email }}
                </p>
              </div>
              <div>
                <!-- Success Message -->
                <div v-if="success" class="mb-5 p-3 rounded-lg bg-success-50 border border-success-200 dark:bg-success-900/20 dark:border-success-800">
                  <p class="text-sm text-success-600 dark:text-success-400">{{ success }}</p>
                </div>

                <!-- Error Message -->
                <div v-if="error" class="mb-5 p-3 rounded-lg bg-error-50 border border-error-200 dark:bg-error-900/20 dark:border-error-800">
                  <p class="text-sm text-error-600 dark:text-error-400">{{ error }}</p>
                </div>

                <form @submit.prevent="handleSubmit">
                  <div class="space-y-5">
                    <!-- OTP Input -->
                    <div>
                      <label
                        for="otp"
                        class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400"
                      >
                        Verification Code<span class="text-error-500">*</span>
                      </label>
                      <input
                        v-model="otp"
                        type="text"
                        id="otp"
                        name="otp"
                        placeholder="Enter 6-digit code"
                        maxlength="6"
                        pattern="[0-9]{6}"
                        required
                        :disabled="isLoading"
                        class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 disabled:opacity-50 disabled:cursor-not-allowed"
                        @input="validateOtp"
                      />
                      <p class="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                        Please enter only numbers
                      </p>
                    </div>
                    <!-- Button -->
                    <div>
                      <button
                        type="submit"
                        :disabled="isLoading || otp.length !== 6"
                        class="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span v-if="isLoading" class="mr-2">
                          <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        </span>
                        {{ isLoading ? 'Verifying...' : 'Verify Code' }}
                      </button>
                    </div>
                  </div>
                </form>
                <div class="mt-5">
                  <p
                    class="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start"
                  >
                    Didn't receive the code?
                    <button
                      @click="resendCode"
                      :disabled="isLoading"
                      class="text-brand-500 hover:text-brand-600 dark:text-brand-400 disabled:opacity-50"
                    >
                      Resend
                    </button>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div
          class="relative items-center hidden w-full h-full lg:w-1/2 bg-brand-950 dark:bg-white/5 lg:grid"
        >
          <div class="flex items-center justify-center z-1">
            <common-grid-shape />
            <div class="flex flex-col items-center max-w-xs">
              <router-link to="/" class="block mb-4">
                <img width="{231}" height="{48}" src="/images/logo/auth-logo.svg" alt="Logo" />
              </router-link>
              <p class="text-center text-gray-400 dark:text-white/60">
                Free and Open-Source Tailwind CSS Admin Dashboard Template
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </FullScreenLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import CommonGridShape from '@/components/common/CommonGridShape.vue'
import FullScreenLayout from '@/components/layout/FullScreenLayout.vue'
import authService from '@/services/auth.service'

const router = useRouter()

const email = ref('')
const otp = ref('')
const isLoading = ref(false)
const error = ref<string | null>(null)
const success = ref<string | null>(null)

onMounted(() => {
  // Get email from sessionStorage
  const storedEmail = sessionStorage.getItem('reset_email')
  if (!storedEmail) {
    // If no email found, redirect to forgot password page
    router.push('/forgot-password')
    return
  }
  email.value = storedEmail
})

const validateOtp = (event: Event) => {
  const target = event.target as HTMLInputElement
  // Only allow numbers
  target.value = target.value.replace(/[^0-9]/g, '')
  otp.value = target.value
}

const handleSubmit = async () => {
  if (!email.value || otp.value.length !== 6) {
    return
  }

  error.value = null
  success.value = null
  isLoading.value = true

  try {
    await authService.verifyOtp({
      email: email.value,
      otp: otp.value,
    })

    success.value = 'OTP verified successfully! Redirecting to reset password...'

    // Store OTP in sessionStorage for the next step (reset password needs it)
    sessionStorage.setItem('reset_otp', otp.value)

    // Redirect to reset password page after 2 seconds
    setTimeout(() => {
      router.push('/reset-password')
    }, 2000)
  } catch (err: any) {
    error.value = err.message || 'Invalid OTP. Please try again.'
  } finally {
    isLoading.value = false
  }
}

const resendCode = async () => {
  if (!email.value || isLoading.value) {
    return
  }

  error.value = null
  success.value = null
  isLoading.value = true

  try {
    await authService.requestPasswordReset({ email: email.value })
    success.value = 'New OTP sent to your email!'
    otp.value = '' // Clear the OTP input
  } catch (err: any) {
    error.value = err.message || 'Failed to resend code. Please try again.'
  } finally {
    isLoading.value = false
  }
}
</script>
