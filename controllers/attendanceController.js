const AttendanceModel = require('../models/attendanceModel');
const UserModel = require('../models/userModel');
const ShiftModel = require('../models/shiftModel');
const Exception = require('../models/exceptionModel');
const mailSender = require('../utils/mailSender');
const excelFormatter = require('../templates/excelFormatter');
const emailTemplate = require('../templates/emailTemplates');
const moment = require('moment');

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

    const userId = userData.memberData._id;
    const createdBy = `${userData.memberData.firstName} ${userData.memberData.lastName}`;
    const date = req.body.date;

    try {
        const existingRecord = await AttendanceModel.findOne({ userId, date });

        if (existingRecord) {
            const updated = await AttendanceModel.findOneAndUpdate(
                { _id: existingRecord._id },
                {
                    $set: {
                        logoutTime: req.body.logoutTime || existingRecord.logoutTime,
                        logoutLocation: req.body.logoutLocation || existingRecord.logoutLocation,
                        logoutImageUrl: req.body.logoutImageUrl || existingRecord.logoutImageUrl,
                        logoutDeviceInfo: req.body.logoutDeviceInfo || existingRecord.logoutDeviceInfo,
                        'faceVerification.logoutVerified': req.body.faceVerification?.logoutVerified ?? existingRecord.faceVerification.logoutVerified,
                        'faceVerification.logoutConfidence': req.body.faceVerification?.logoutConfidence ?? existingRecord.faceVerification.logoutConfidence,
                        'faceVerification.failedReason': req.body.faceVerification?.failedReason ?? existingRecord.faceVerification.failedReason,
                        flags: req.body.flags || existingRecord.flags,
                        isEarlyLogout: req.body.isEarlyLogout ?? existingRecord.isEarlyLogout,
                        overtimeHours: req.body.overtimeHours ?? existingRecord.overtimeHours,
                        updatedBy: createdBy,
                        updatorIp: clientIp
                    }
                },
                { new: true }
            );

            return res.send({
                data: updated,
                message: "Logout updated successfully",
                status: true
            });
        } else {
            const savedUser = new AttendanceModel({
                ...req.body,
                creatorIp: clientIp,
                clientId,
                userId,
                createdBy
            });

            await savedUser.save();

            return res.send({
                data: savedUser,
                message: "Attendance Created Successfully",
                status: true
            });
        }
    } catch (error) {
        await logException(error.message, 'createAttendance', clientIp, clientId);
        return res.status(500).json({ status: false, error: error.message });
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
            const dateObj = new Date(yearNum, monthNum, day);
            const isoDate = dateObj.toISOString().split("T")[0];
            const formattedDate = moment(dateObj).format("DD-MMM-YYYY");

            attendanceGrid.push({
                day,
                status: flagMap[isoDate] || 'A',
                date: formattedDate
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

exports.shiftDetails = async (req, res) => {
    const userData = req.user;
    const clientIp = req.clientIp;
    const clientId = userData.memberData.clientId;

    function formatToISO(dateStr) {
        const [dd, mm, yyyy] = dateStr.split("-");
        return `${yyyy}-${mm}-${dd}`;
    }

    try {
        const userId = Number(req.query.userId);
        const rawDate = req.query.date;
        const formattedDate = rawDate ? formatToISO(rawDate) : null;

        const user = await UserModel.findOne({ _id: userId, clientId: clientId });
        if (!user || !user.shift) {
            return res.send({
                data: [],
                message: "User or Shift Not Found",
                status: true
            });
        }

        const shift = await ShiftModel.findOne({ shift: user.shift, clientId: clientId });
        if (!shift) {
            return res.send({
                data: [],
                message: "No Shift Record Found",
                status: true
            });
        }

        const present = [];
        const absent = [];

        let isYou = false;
        let face = "N";

        if (formattedDate) {
            const allUsers = await UserModel.find({ clientId: clientId });
            const attendanceRecords = await AttendanceModel.find({
                clientId: clientId,
                date: formattedDate
            });

            const presentUserIds = attendanceRecords
                .filter(record => record.flags === 'P')
                .map(record => record.userId);

            for (let u of allUsers) {
                const uInfo = {
                    id: u._id,
                    name: `${u.firstName} ${u.lastName}`,
                    designation: u.designation || '',
                    department: u.department || '',
                    imgUrl: u.imageUrl || '',
                };

                if (presentUserIds.includes(u._id)) {
                    present.push(uInfo);
                } else {
                    absent.push(uInfo);
                }
            }

            const myRecord = attendanceRecords.find(
                record => record.userId === userId && record.flags === 'P'
            );

            if (myRecord) {
                const hasLoginTime = !!myRecord.loginTime;
                const hasLogoutTime = !!myRecord.logoutTime;

                isYou = !(hasLoginTime && hasLogoutTime);

                if (myRecord.loginImageUrl) {
                    face = "Y";
                }
            }
        }

        return res.send({
            data: {
                shift: shift.shift,
                startTime: shift.startTime,
                endTime: shift.endTime,
                present,
                absent,
                isYou,
                face
            },
            message: "Shift Details Fetched Successfully",
            status: true
        });

    } catch (error) {
        await logException(error.message, 'shiftDetails', clientIp, clientId);
        res.status(500).json({ status: false, error: error.message });
    }
};