import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, from, savedPosition) {
    return savedPosition || { left: 0, top: 0 }
  },
  routes: [
    {
      path: '/',
      redirect: '/admin',
    },
    {
      path: '/admin',
      name: 'AdminDashboard',
      component: () => import('../views/Dashboard.vue'),
      meta: {
        title: 'Admin Dashboard',
        requiresAuth: true,
        requiresRole: 'admin',
      },
    },
    {
      path: '/admin/user/student',
      name: 'StudentManagement',
      component: () => import('../views/Admin/StudentManagement.vue'),
      meta: {
        title: 'Student Management',
        requiresAuth: true,
        requiresRole: 'admin',
      },
    },
    {
      path: '/admin/user/teacher',
      name: 'TeacherManagement',
      component: () => import('../views/Admin/TeacherManagement.vue'),
      meta: {
        title: 'Teacher Management',
        requiresAuth: true,
        requiresRole: 'admin',
      },
    },
    {
      path: '/admin/academic/academic-periode',
      name: 'AcademicPeriodeManagement',
      component: () => import('../views/Admin/AcademicPeriodeManagement.vue'),
      meta: {
        title: 'Academic Periode Management',
        requiresAuth: true,
        requiresRole: 'admin',
      },
    },
    {
      path: '/admin/academic/subject',
      name: 'SubjectManagement',
      component: () => import('../views/Admin/SubjectManagement.vue'),
      meta: {
        title: 'Subject Management',
        requiresAuth: true,
        requiresRole: 'admin',
      },
    },
    {
      path: '/admin/academic/class',
      name: 'ClassManagement',
      component: () => import('../views/Admin/ClassManagement.vue'),
      meta: {
        title: 'Class Management',
        requiresAuth: true,
        requiresRole: 'admin',
      },
    },
    {
      path: '/admin/academic/class/:classId',
      name: 'ClassDetail',
      component: () => import('../views/Admin/ClassDetail.vue'),
      meta: {
        title: 'Class Details',
        requiresAuth: true,
        requiresRole: 'admin',
      },
    },
    {
      path: '/teacher',
      name: 'TeacherDashboard',
      component: () => import('../views/TeacherDashboard.vue'),
      meta: {
        title: 'Teacher Dashboard',
        requiresAuth: true,
        requiresRole: 'teacher',
      },
    },
    {
      path: '/signin',
      name: 'Signin',
      component: () => import('../views/Auth/Signin.vue'),
      meta: {
        title: 'Signin',
        guest: true,
      },
    },
    {
      path: '/signup',
      name: 'Signup',
      component: () => import('../views/Auth/Signup.vue'),
      meta: {
        title: 'Signup',
        guest: true,
      },
    },
    {
      path: '/forgot-password',
      name: 'ForgotPassword',
      component: () => import('../views/Auth/ForgotPassword.vue'),
      meta: {
        title: 'Forgot Password',
        guest: true,
      },
    },
    {
      path: '/verify-otp',
      name: 'VerifyOtp',
      component: () => import('../views/Auth/VerifyOtp.vue'),
      meta: {
        title: 'Verify OTP',
        guest: true,
      },
    },
    {
      path: '/reset-password',
      name: 'ResetPassword',
      component: () => import('../views/Auth/ResetPassword.vue'),
      meta: {
        title: 'Reset Password',
        guest: true,
      },
    },
  ],
})

export default router

// Navigation guard
router.beforeEach((to, from, next) => {
  // Set page title
  document.title = `${to.meta.title} | Admin School Attendance`

  // Check authentication status
  const token = localStorage.getItem('access_token')
  const userStr = localStorage.getItem('user')
  let user = null

  try {
    user = userStr ? JSON.parse(userStr) : null
  } catch (e) {
    console.error('Error parsing user from localStorage:', e)
  }

  const isAuthenticated = !!token && !!user

  // Handle guest-only routes (signin, signup, etc.)
  if (to.meta.guest && isAuthenticated) {
    // If user is already authenticated and trying to access guest routes,
    // redirect to their dashboard based on role
    if (user.role === 'admin') {
      return next('/admin')
    } else if (user.role === 'teacher') {
      return next('/teacher')
    }
    return next('/')
  }

  // Handle protected routes
  if (to.meta.requiresAuth && !isAuthenticated) {
    // If route requires auth and user is not authenticated, redirect to signin
    return next('/signin')
  }

  // Handle role-based access
  if (to.meta.requiresRole && user && user.role !== to.meta.requiresRole) {
    // If user doesn't have the required role, redirect to their dashboard
    if (user.role === 'admin') {
      return next('/admin')
    } else if (user.role === 'teacher') {
      return next('/teacher')
    }
    return next('/signin')
  }

  next()
})
