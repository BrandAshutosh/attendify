const ShiftModel = require('../models/shiftModel');
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

exports.createShift = async (req, res) => {
    const userData = req.user;
    const clientIp = req.clientIp;
    const clientId = userData.memberData.clientId;

    try {
        const savedShift = new ShiftModel({
            ...req.body,
            creatorIp: clientIp,
            clientId: clientId,
            createdBy: `${userData.memberData.firstName} ${userData.memberData.lastName}`,
        });

        await savedShift.save();

        return res.send({
            data: savedShift,
            message: "Shift Created Successfully",
            status: true
        });

    } catch (error) {
        await logException(error.message, 'createShift', clientIp, clientId);
        res.status(500).json({ status: false, error: error.message });
    }
};

exports.getShifts = async (req, res) => {
    const userData = req.user;
    const clientIp = req.clientIp;
    const clientId = userData.memberData.clientId;

    try {
        let ShiftList;

        if (clientId === parseInt(process.env.MASTER_CLIENT_ID)) {
            ShiftList = await ShiftModel.find().sort({ _id: -1 });
        } else {
            ShiftList = await ShiftModel.find({ clientId: clientId }).sort({ _id: -1 });
        }

        if (ShiftList.length === 0) {
            return res.send({
                data: [],
                message: "No Shift Record Found",
                status: true
            });
        }

        return res.send({
            data: ShiftList,
            message: "Shifts Fetched Successfully",
            status: true
        });

    } catch (error) {
        await logException(error.message, 'getShifts', clientIp, clientId);
        res.status(500).json({ status: false, error: error.message });
    }
};

exports.getShiftById = async (req, res) => {
    const userData = req.user;
    const clientIp = req.clientIp;
    const clientId = userData.memberData.clientId;

    try {
        const shift = await ShiftModel.findOne({ _id: req.query.id, clientId: clientId });

        if (!shift) {
            return res.send({
                data: [],
                message: "No Record Found",
                status: true
            });
        } else {
            return res.send({
                data: shift,
                message: "Shift Fetched Successfully",
                status: true
            });
        }

    } catch (error) {
        await logException(error.message, 'getShiftById', clientIp, clientId);
        res.status(500).json({ status: false, error: error.message });
    }
};

exports.updateShift = async (req, res) => {
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

        let shift;

        if (clientId === parseInt(process.env.MASTER_CLIENT_ID)) {
            shift = await ShiftModel.findOneAndUpdate(
                { _id: req.query.id },
                updatedFields,
                { new: true }
            );
        } else {
            shift = await ShiftModel.findOneAndUpdate(
                { _id: req.query.id, clientId: clientId },
                updatedFields,
                { new: true }
            );
        }

        if (!shift) {
            return res.send({
                data: [],
                message: "No Record Found To Update",
                status: true
            });
        } else {
            return res.send({
                data: shift,
                message: "Shift Updated Successfully",
                status: true
            });
        }

    } catch (error) {
        await logException(error.message, 'updateShift', clientIp, clientId);
        res.status(500).json({ status: false, error: error.message });
    }
};

exports.deleteShift = async (req, res) => {
    const userData = req.user;
    const clientIp = req.clientIp;
    const clientId = userData.memberData.clientId;
    const masterClientId = parseInt(process.env.MASTER_CLIENT_ID);

    try {
        let ids = req.query.id.split(',').map(id => Number(id.trim()));
        let ShiftList;

        if (clientId === masterClientId) {
            ShiftList = await ShiftModel.find({ _id: { $in: ids } }).sort({ _id: -1 });
        } else {
            ShiftList = await ShiftModel.find({ _id: { $in: ids }, clientId: clientId }).sort({ _id: -1 });
        }

        if (ShiftList.length === 0) {
            return res.send({
                data: [],
                message: "No Records Found To Delete",
                status: true
            });
        }

        const ShiftData = ShiftList.map(ip => ip.toObject());
        const fileBuffer = await excelFormatter.generateExcelBuffer(ShiftData, 'Shifts');

        const attachments = [{
            filename: 'deleted_shifts.xlsx',
            content: fileBuffer,
            encoding: 'base64'
        }];

        const emailText = emailTemplate.DELETE_DATA_MAIL.replace('{{firstName}}', userData.memberData.firstName);

        await mailSender.sendEmailAttachment(
            userData.memberData.emailId,
            "Shift Records Deletion",
            emailText,
            attachments,
            clientIp,
            { isHtml: true }
        );

        const deleted = await ShiftModel.deleteMany({ _id: { $in: ids } });

        return res.send({
            count: deleted.deletedCount,
            message: "Shift(s) Deleted Successfully",
            status: true
        });

    } catch (error) {
        await logException(error.message, 'deleteShift', clientIp, clientId);
        res.status(500).json({ status: false, error: error.message });
    }
};

exports.exportShifts = async (req, res) => {
    const userData = req.user;
    const clientIp = req.clientIp;
    const clientId = userData.memberData.clientId;
    const masterClientId = parseInt(process.env.MASTER_CLIENT_ID);

    try {
        let ShiftList;

        if (clientId === masterClientId) {
            ShiftList = await ShiftModel.find().sort({ _id: -1 });
        } else {
            ShiftList = await ShiftModel.find({ clientId: clientId }).sort({ _id: -1 });
        }

        if (ShiftList.length === 0) {
            return res.send({
                data: [],
                message: "No Records Found To Export",
                status: true
            });
        }

        const ShiftData = ShiftList.map(ip => ip.toObject());
        const fileBuffer = await excelFormatter.generateExcelBuffer(ShiftData, 'Shifts');

        const attachments = [{
            filename: 'exported_shifts.xlsx',
            content: fileBuffer,
            encoding: 'base64'
        }];

        const emailText = emailTemplate.EXPORT_DATA_MAIL.replace('{{firstName}}', userData.memberData.firstName);

        await mailSender.sendEmailAttachment(
            userData.memberData.emailId,
            "Exported Shift Records",
            emailText,
            attachments,
            clientIp,
            { isHtml: true }
        );

        return res.send({
            message: "Shifts Data Exported Successfully. Check Your Email.",
            status: true
        });

    } catch (error) {
        await logException(error.message, 'exportShifts', clientIp, clientId);
        res.status(500).json({ status: false, error: error.message });
    }
};