import express from "express";
import { authMiddleware } from '../middleware/auth-middleware.js';
import attendanceController from "../controllers/attendance.controller.js";

const studentRouter = new express.Router();
studentRouter.use(authMiddleware);

// attendance (2)
studentRouter.post('/student/attendance/check-in',
    attendanceController.studentCheckInController); //lol 

//Total ada 2 endpoint   
export {
    studentRouter
}

//getClassSchedules() => maybe wee need this?


/*
## yang belum ada di re-factor
============================
student
============================
/api/student/sessions/active
/api/student/attendance/summary
/api/student/profile


============================
teacher
============================





============================
admin
============================




============================
users
============================



## yang kelebihan di re-factor
============================
student
============================ 
/student/attendance/check-in -- Ini harusnya nanti pakai face + geolocation


============================
teacher
============================


 
============================
admin
============================

 
============================
users
============================



## yang sudah ada di refactor

============================
student
============================ 


============================
teacher
============================

 

============================
admin
============================




============================
users
============================
/api/users/schedule/date
/api/users/schedule/weekly
/api/users/schedule/academic-period/:academicPeriodId


*/