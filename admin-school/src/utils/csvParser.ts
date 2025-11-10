import Papa from 'papaparse'
import type {
  StudentFormData,
  TeacherFormData,
  CSVValidationError,
  ParsedCSVData
} from '@/types/user'

// Required fields for each user type
const STUDENT_REQUIRED_FIELDS = [
  'username',
  'email',
  'password',
  'studentId',
  'fullName',
  'classId'
]

const TEACHER_REQUIRED_FIELDS = [
  'username',
  'email',
  'password',
  'teacherId',
  'fullName'
]

// Optional fields
const STUDENT_OPTIONAL_FIELDS = [
  'phone',
  'address',
  'dateOfBirth',
  'parentPhone',
  'enrollmentDate'
]

const TEACHER_OPTIONAL_FIELDS = ['phone', 'address', 'hireDate']

/**
 * Validates email format
 */
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validates date format (YYYY-MM-DD)
 */
const isValidDate = (date: string): boolean => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(date)) return false

  const parsedDate = new Date(date)
  return !isNaN(parsedDate.getTime())
}

/**
 * Validates phone number (basic validation)
 */
const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^[0-9+\s()-]{8,20}$/
  return phoneRegex.test(phone)
}

/**
 * Validates a single student row
 */
const validateStudentRow = (
  row: any,
  rowIndex: number
): CSVValidationError[] => {
  const errors: CSVValidationError[] = []

  // Check required fields
  STUDENT_REQUIRED_FIELDS.forEach((field) => {
    if (!row[field] || row[field].toString().trim() === '') {
      errors.push({
        row: rowIndex + 1,
        field,
        message: `${field} is required`
      })
    }
  })

  // Validate email format
  if (row.email && !isValidEmail(row.email)) {
    errors.push({
      row: rowIndex + 1,
      field: 'email',
      message: 'Invalid email format'
    })
  }

  // Validate classId is a number
  if (row.classId && isNaN(parseInt(row.classId))) {
    errors.push({
      row: rowIndex + 1,
      field: 'classId',
      message: 'classId must be a number'
    })
  }

  // Validate optional date fields
  if (row.dateOfBirth && !isValidDate(row.dateOfBirth)) {
    errors.push({
      row: rowIndex + 1,
      field: 'dateOfBirth',
      message: 'Invalid date format. Use YYYY-MM-DD'
    })
  }

  if (row.enrollmentDate && !isValidDate(row.enrollmentDate)) {
    errors.push({
      row: rowIndex + 1,
      field: 'enrollmentDate',
      message: 'Invalid date format. Use YYYY-MM-DD'
    })
  }

  // Validate phone numbers
  if (row.phone && !isValidPhone(row.phone)) {
    errors.push({
      row: rowIndex + 1,
      field: 'phone',
      message: 'Invalid phone number format'
    })
  }

  if (row.parentPhone && !isValidPhone(row.parentPhone)) {
    errors.push({
      row: rowIndex + 1,
      field: 'parentPhone',
      message: 'Invalid phone number format'
    })
  }

  return errors
}

/**
 * Validates a single teacher row
 */
const validateTeacherRow = (
  row: any,
  rowIndex: number
): CSVValidationError[] => {
  const errors: CSVValidationError[] = []

  // Check required fields
  TEACHER_REQUIRED_FIELDS.forEach((field) => {
    if (!row[field] || row[field].toString().trim() === '') {
      errors.push({
        row: rowIndex + 1,
        field,
        message: `${field} is required`
      })
    }
  })

  // Validate email format
  if (row.email && !isValidEmail(row.email)) {
    errors.push({
      row: rowIndex + 1,
      field: 'email',
      message: 'Invalid email format'
    })
  }

  // Validate optional date fields
  if (row.hireDate && !isValidDate(row.hireDate)) {
    errors.push({
      row: rowIndex + 1,
      field: 'hireDate',
      message: 'Invalid date format. Use YYYY-MM-DD'
    })
  }

  // Validate phone number
  if (row.phone && !isValidPhone(row.phone)) {
    errors.push({
      row: rowIndex + 1,
      field: 'phone',
      message: 'Invalid phone number format'
    })
  }

  return errors
}

/**
 * Transforms CSV row to StudentFormData
 */
const transformToStudentData = (row: any): StudentFormData => {
  return {
    username: row.username?.trim(),
    email: row.email?.trim(),
    password: row.password?.trim(),
    role: 'student',
    studentId: row.studentId?.trim(),
    fullName: row.fullName?.trim(),
    classId: parseInt(row.classId),
    phone: row.phone?.trim() || undefined,
    address: row.address?.trim() || undefined,
    dateOfBirth: row.dateOfBirth?.trim() || undefined,
    parentPhone: row.parentPhone?.trim() || undefined,
    enrollmentDate: row.enrollmentDate?.trim() || undefined
  }
}

/**
 * Transforms CSV row to TeacherFormData
 */
const transformToTeacherData = (row: any): TeacherFormData => {
  return {
    username: row.username?.trim(),
    email: row.email?.trim(),
    password: row.password?.trim(),
    role: 'teacher',
    teacherId: row.teacherId?.trim(),
    fullName: row.fullName?.trim(),
    phone: row.phone?.trim() || undefined,
    address: row.address?.trim() || undefined,
    hireDate: row.hireDate?.trim() || undefined
  }
}

/**
 * Parses student CSV file
 */
export const parseStudentCSV = (
  file: File
): Promise<ParsedCSVData<StudentFormData>> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      complete: (results) => {
        const errors: CSVValidationError[] = []
        const data: StudentFormData[] = []

        // Validate and transform each row
        results.data.forEach((row: any, index: number) => {
          const rowErrors = validateStudentRow(row, index)
          errors.push(...rowErrors)

          // Only transform if no errors for this row
          if (rowErrors.length === 0) {
            data.push(transformToStudentData(row))
          }
        })

        resolve({
          data,
          errors,
          isValid: errors.length === 0
        })
      },
      error: (error) => {
        reject(new Error(`CSV parsing failed: ${error.message}`))
      }
    })
  })
}

/**
 * Parses teacher CSV file
 */
export const parseTeacherCSV = (
  file: File
): Promise<ParsedCSVData<TeacherFormData>> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      complete: (results) => {
        const errors: CSVValidationError[] = []
        const data: TeacherFormData[] = []

        // Validate and transform each row
        results.data.forEach((row: any, index: number) => {
          const rowErrors = validateTeacherRow(row, index)
          errors.push(...rowErrors)

          // Only transform if no errors for this row
          if (rowErrors.length === 0) {
            data.push(transformToTeacherData(row))
          }
        })

        resolve({
          data,
          errors,
          isValid: errors.length === 0
        })
      },
      error: (error) => {
        reject(new Error(`CSV parsing failed: ${error.message}`))
      }
    })
  })
}

/**
 * Generates a sample CSV template for students
 */
export const generateStudentCSVTemplate = (): string => {
  const headers = [
    ...STUDENT_REQUIRED_FIELDS,
    ...STUDENT_OPTIONAL_FIELDS
  ].join(',')

  const example =
    'john_doe,john@school.com,password123,S001,John Doe,1,081234567890,Jl. Example St.,2010-01-15,081298765432,2024-07-01'

  return `${headers}\n${example}`
}

/**
 * Generates a sample CSV template for teachers
 */
export const generateTeacherCSVTemplate = (): string => {
  const headers = [
    ...TEACHER_REQUIRED_FIELDS,
    ...TEACHER_OPTIONAL_FIELDS
  ].join(',')

  const example =
    'jane_smith,jane@school.com,password123,T001,Jane Smith,081234567890,Jl. Example St.,2020-08-01'

  return `${headers}\n${example}`
}

/**
 * Downloads a CSV template file
 */
export const downloadCSVTemplate = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
