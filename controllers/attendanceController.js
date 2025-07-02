const AttendanceModel = require('../models/attendanceModel');
const Exception = require('../models/exceptionModel');
const mailSender = require('../utils/mailSender');
const excelFormatter = require('../templates/excelFormatter');
const emailTemplate = require('../templates/emailTemplates');

const logException = async (message, methodName, ipAddress, clientId) => {
    try {
        const newException = new Exception({
            message,
            methodName,
            ipAddress,
            clientId
        });
        await newException.save();
    } catch (err) {
        console.log('Error logging exception:', err);
    }
};

exports.createAttendance = async (req, res) => {
    const userData = req.user;
    const clientIp = req.clientIp;
    const clientId = userData.memberData.clientId;

    try {
        const savedUser = new AttendanceModel({
            ...req.body,
            creatorIp: clientIp,
            clientId: clientId,
            userId: userData.memberData._id,
            createdBy: `${userData.memberData.firstName} ${userData.memberData.lastName}`,
        });

        await savedUser.save();
        return res.send({
            data: savedUser,
            message: "Attendance Created Successfully",
            status: true
        });

    } catch (error) {
        await logException(error.message, 'createAttendance', clientIp, clientId);
        res.status(500).json({ status: false, error: error.message });
    }
};

exports.getAttendances = async (req, res) => {
    const userData = req.user;
    const clientIp = req.clientIp;
    const clientId = userData.memberData.clientId;

    try {
        let attendancelist;

        if (clientId === parseInt(process.env.MASTER_CLIENT_ID)) {
            attendancelist = await AttendanceModel.find().sort({ _id: -1 });
        } else {
            attendancelist = await AttendanceModel.find({ clientId: clientId }).sort({ _id: -1 });
        }

        if (attendancelist.length === 0) {
            return res.send({
                data: [],
                message: "No User Record Found",
                status: true
            });
        }

        return res.send({
            data: attendancelist,
            message: "User Fetched Successfully",
            status: true
        });

    } catch (error) {
        await logException(error.message, 'getAttendances', clientIp, clientId);
        res.status(500).json({ status: false, error: error.message });
    }
};

exports.getMonthlyAttendanceGrid = async (req, res) => {
    const userData = req.user;
    const clientIp = req.clientIp;
    const clientId = userData.memberData.clientId;

    const { userId, month } = req.query;

    try {
        const [year, monthStr] = month.split("-");
        const yearNum = parseInt(year);
        const monthNum = parseInt(monthStr) - 1;

        const startDate = new Date(yearNum, monthNum, 1);
        const endDate = new Date(yearNum, monthNum + 1, 0);
        const totalDays = endDate.getDate();

        const start = startDate.toISOString().split("T")[0];
        const end = endDate.toISOString().split("T")[0];

        let attendances;
        if (clientId === parseInt(process.env.MASTER_CLIENT_ID)) {
            attendances = await AttendanceModel.find({
                userId: parseInt(userId),
                date: { $gte: start, $lte: end }
            });
        } else {
            attendances = await AttendanceModel.find({
                clientId: clientId,
                userId: parseInt(userId),
                date: { $gte: start, $lte: end }
            });
        }

        const flagMap = {};
        attendances.forEach(entry => {
            flagMap[entry.date] = entry.flags || 'A';
        });

        const attendanceGrid = [];
        for (let day = 1; day <= totalDays; day++) {
            const date = new Date(yearNum, monthNum, day).toISOString().split("T")[0];
            attendanceGrid.push({
                day,
                flag: flagMap[date] || 'A'
            });
        }

        return res.send({
            data: attendanceGrid,
            message: "Monthly Attendance Grid Fetched",
            status: true
        });

    } catch (error) {
        await logException(error.message, 'getMonthlyAttendanceGrid', clientIp, clientId);
        res.status(500).json({ status: false, error: error.message });
    }
};

exports.getAttendanceById = async (req, res) => {
    const userData = req.user;
    const clientIp = req.clientIp;
    const clientId = userData.memberData.clientId;

    try {
        const attendance = await AttendanceModel.findOne({ _id: req.query.id, clientId: clientId });

        if (!attendance) {
            return res.send({
                data: [],
                message: "No Record Found",
                status: true
            });
        } else {
            return res.send({
                data: attendance,
                message: "Attendance Fetched Successfully",
                status: true
            });
        }
    } catch (error) {
        await logException(error.message, 'getAttendanceById', clientIp, clientId);
        res.status(500).json({ status: false, error: error.message });
    }
};

exports.updateAttendance = async (req, res) => {
    const userData = req.user;
    const clientIp = req.clientIp;
    const clientId = userData.memberData.clientId;

    try {
        const updatedFields = {
            ...req.body,
            updatedBy: `${userData.memberData.firstName} ${userData.memberData.lastName}`,
            updatorIp: clientIp,
            clientId: clientId
        };

        let attendance;

        if (clientId === parseInt(process.env.MASTER_CLIENT_ID)) {
            attendance = await AttendanceModel.findOneAndUpdate(
                { _id: req.query.id },
                updatedFields,
                { new: true }
            );
        } else {
            attendance = await AttendanceModel.findOneAndUpdate(
                { _id: req.query.id, clientId: clientId },
                updatedFields,
                { new: true }
            );
        }

        if (!attendance) {
            return res.send({
                data: [],
                message: "No Record Found To Update",
                status: true
            });
        } else {
            return res.send({
                data: attendance,
                message: "Attendance Updated Successfully",
                status: true
            });
        }
    } catch (error) {
        await logException(error.message, 'updateAttendance', clientIp, clientId);
        res.status(500).json({ status: false, error: error.message });
    }
};

exports.deleteAttendance = async (req, res) => {
    const userData = req.user;
    const clientIp = req.clientIp;
    const clientId = userData.memberData.clientId;
    const masterClientId = parseInt(process.env.MASTER_CLIENT_ID);

    try {
        let ids = req.query.id.split(',').map(id => Number(id.trim()));
        let attendance;

        if (clientId === masterClientId) {
            attendance = await AttendanceModel.find({ _id: { $in: ids } }).sort({ _id: -1 });
        } else {
            attendance = await AttendanceModel.find({ _id: { $in: ids }, clientId: clientId }).sort({ _id: -1 });
        }

        if (attendance.length === 0) {
            return res.send({
                data: [],
                message: "No Records Found To Delete",
                status: true
            });
        }

        const attendanceData = attendance.map(ip => ip.toObject());
        const fileBuffer = await excelFormatter.generateExcelBuffer(attendanceData, 'Attendance');

        const attachments = [{
            filename: 'deleted_attendance.xlsx',
            content: fileBuffer,
            encoding: 'base64'
        }];

        const emailText = emailTemplate.DELETE_DATA_MAIL.replace('{{firstName}}', userData.memberData.firstName);

        await mailSender.sendEmailAttachment(
            userData.memberData.emailId,
            "Attendance Records Deletion",
            emailText,
            attachments,
            clientIp,
            { isHtml: true }
        );

        const deletedAttendance = await AttendanceModel.deleteMany({ _id: { $in: ids } });

        return res.send({
            count: deletedAttendance.deletedCount,
            message: "Attendance Deleted Successfully",
            status: true
        });

    } catch (error) {
        await logException(error.message, 'deleteAttendance', clientIp, clientId);
        res.status(500).json({ status: false, error: error.message });
    }
};

exports.exportAttendance = async (req, res) => {
    const userData = req.user;
    const clientIp = req.clientIp;
    const clientId = userData.memberData.clientId;
    const masterClientId = parseInt(process.env.MASTER_CLIENT_ID);

    try {
        let attendances;

        if (clientId === masterClientId) {
            attendances = await AttendanceModel.find().sort({ _id: -1 });
        } else {
            attendances = await AttendanceModel.find({ clientId: clientId }).sort({ _id: -1 });
        }

        if (attendances.length === 0) {
            return res.send({
                data: [],
                message: "No Records Found To Export",
                status: true
            });
        }

        const attendanceData = attendances.map(ip => ip.toObject());
        const fileBuffer = await excelFormatter.generateExcelBuffer(attendanceData, 'Attendance');

        const attachments = [{
            filename: 'exported_attendance.xlsx',
            content: fileBuffer,
            encoding: 'base64'
        }];

        const emailText = emailTemplate.EXPORT_DATA_MAIL.replace('{{firstName}}', userData.memberData.firstName);

        await mailSender.sendEmailAttachment(
            userData.memberData.emailId,
            "Exported Attendance Records",
            emailText,
            attachments,
            clientIp,
            { isHtml: true }
        );

        return res.send({
            message: "Attendance Data Exported Successfully. Check Your Email.",
            status: true
        });

    } catch (error) {
        await logException(error.message, 'exportAttendance', clientIp, clientId);
        res.status(500).json({ status: false, error: error.message });
    }
};