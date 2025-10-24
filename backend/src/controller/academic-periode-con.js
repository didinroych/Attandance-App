import academicPeriodeServ from "../service/academic-periode-serv.js";

const getAcademicPeriodCon = async(req, res, next) => {
    try {
        const result = await academicPeriodeServ.getAcademicPeriod();
        res.status(200).json({
            data: result
        });
    } catch (e) {
        next(e);
    }
}

export default {
    getAcademicPeriodCon
}