import { ref, onUnmounted, type Ref } from 'vue'

interface CameraDevice {
  deviceId: string
  label: string
}

export function useCamera() {
  const videoRef: Ref<HTMLVideoElement | null> = ref(null)
  const canvasRef: Ref<HTMLCanvasElement | null> = ref(null)
  const stream: Ref<MediaStream | null> = ref(null)
  const isActive = ref(false)
  const error = ref<string | null>(null)
  const availableCameras = ref<CameraDevice[]>([])
  const selectedCameraId = ref<string | null>(null)

  /**
   * Enumerate available video input devices (cameras)
   */
  const enumerateCameras = async (): Promise<void> => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter(device => device.kind === 'videoinput')

      availableCameras.value = videoDevices.map((device, index) => ({
        deviceId: device.deviceId,
        label: device.label || `Camera ${index + 1}`
      }))

      // Auto-select first camera if none selected
      if (availableCameras.value.length > 0 && !selectedCameraId.value) {
        selectedCameraId.value = availableCameras.value[0].deviceId
      }
    } catch (err) {
      console.error('Error enumerating cameras:', err)
      error.value = 'Cannot enumerate cameras.'
    }
  }

  /**
   * Start the camera/webcam
   * @param deviceId - Optional specific camera device ID
   */
  const startCamera = async (deviceId?: string): Promise<boolean> => {
    try {
      error.value = null

      // Use specified deviceId or the selected one
      const cameraId = deviceId || selectedCameraId.value

      const constraints: MediaStreamConstraints = {
        video: cameraId
          ? {
              deviceId: { exact: cameraId },
              width: { ideal: 1280 },
              height: { ideal: 720 }
            }
          : {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: 'user'
            }
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)

      if (videoRef.value) {
        videoRef.value.srcObject = mediaStream
        stream.value = mediaStream
        isActive.value = true

        // Update selected camera ID if provided
        if (deviceId) {
          selectedCameraId.value = deviceId
        }

        return true
      }

      return false
    } catch (err) {
      console.error('Error accessing camera:', err)
      error.value = 'Cannot access camera. Please check permissions.'
      isActive.value = false
      return false
    }
  }

  /**
   * Stop the camera/webcam
   */
  const stopCamera = () => {
    if (stream.value) {
      stream.value.getTracks().forEach(track => track.stop())
      stream.value = null
    }

    if (videoRef.value && videoRef.value.srcObject) {
      videoRef.value.srcObject = null
    }

    isActive.value = false
  }

  /**
   * Capture a frame from the video stream
   * Returns a Blob that can be uploaded to the API
   */
  const captureFrame = async (): Promise<Blob | null> => {
    if (!canvasRef.value || !videoRef.value) {
      return null
    }

    const canvas = canvasRef.value
    const video = videoRef.value

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw the current video frame to canvas
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      return null
    }

    ctx.drawImage(video, 0, 0)

    // Convert canvas to blob
    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          resolve(blob)
        },
        'image/jpeg',
        0.95
      )
    })
  }

  /**
   * Switch to a different camera
   * @param deviceId - The device ID of the camera to switch to
   */
  const switchCamera = async (deviceId: string): Promise<boolean> => {
    // Stop current camera
    stopCamera()

    // Start with new camera
    return await startCamera(deviceId)
  }

  /**
   * Cleanup when component unmounts
   */
  onUnmounted(() => {
    stopCamera()
  })

  return {
    videoRef,
    canvasRef,
    isActive,
    error,
    availableCameras,
    selectedCameraId,
    enumerateCameras,
    startCamera,
    stopCamera,
    switchCamera,
    captureFrame
  }
}
