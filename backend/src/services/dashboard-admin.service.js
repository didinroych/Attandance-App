import { prismaClient } from "../application/database.js"

const getStatisticDashboard = async(request) => {
    const [
        totalStudents,
        totalTeachers,
        totalClasses,
        totalSubjects
    ] = await Promise.all([
        prismaClient.user.count({
            where: {
                isActive: true,
                role: 'student',
            }
        }),
        prismaClient.user.count({
            where: {
                isActive: true,
                role: 'teacher',
            }
        }),
        prismaClient.class.count(),
        prismaClient.subject.count()
    ]);


    return {
        totalStudents,
        totalTeachers,
        totalClasses,
        totalSubjects
    };
}

export default {
    getStatisticDashboard
}