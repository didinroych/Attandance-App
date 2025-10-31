// src/composables/useSchoolMetrics.js
import { ref, onMounted } from 'vue'

export function useSchoolMetrics() {
    const metrics = ref({
        students: 0,
        teachers: 0,
        classes: 0,
        subjects: 0
    })
    const loading = ref(false)
    const error = ref(null)

    const fetchMetrics = async() => {
        loading.value = true
        error.value = null

        try {
            const response = await fetch('/api/school/metrics')

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const data = await response.json()
            metrics.value = data
        } catch (err) {
            error.value = err.message
            console.error('Error fetching metrics:', err)
        } finally {
            loading.value = false
        }
    }

    onMounted(() => {
        fetchMetrics()
    })

    return {
        metrics,
        loading,
        error,
        fetchMetrics
    }
}