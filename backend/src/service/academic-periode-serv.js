import { validate } from "../validation/validation.js";
import { prismaClient } from "../application/database.js";
import { ResponseError } from "../error/response-error.js";

export const getAcademicPeriod = async() => {

    const academicPeriod = await prismaClient.academicPeriod.findMany({
        select: {
            id: true,
            name: true,
            isActive: true
        }
    })
    return academicPeriod
}

export default {
    getAcademicPeriod
}