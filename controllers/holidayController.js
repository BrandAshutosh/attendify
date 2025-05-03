const HolidayModel = require('../models/holidayModel');
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

exports.createHoliday = async (req, res) => {
    const userData = req.user;
    const clientIp = req.clientIp;
    const clientId = userData.memberData.clientId;

    try {
        const newHoliday = new HolidayModel({
            ...req.body,
            creatorIp: clientIp,
            clientId: clientId,
            createdBy: `${userData.memberData.firstName} ${userData.memberData.lastName}`,
        });

        await newHoliday.save();

        return res.send({
            data: newHoliday,
            message: "Holiday Created Successfully",
            status: true
        });

    } catch (error) {
        await logException(error.message, 'createHoliday', clientIp, clientId);
        res.status(500).json({ status: false, error: error.message });
    }
};

exports.getHolidays = async (req, res) => {
    const userData = req.user;
    const clientIp = req.clientIp;
    const clientId = userData.memberData.clientId;
    const masterClientId = parseInt(process.env.MASTER_CLIENT_ID);

    try {
        let holidays;

        if (clientId === masterClientId) {
            holidays = await HolidayModel.find().sort({ _id: -1 });
        } else {
            holidays = await HolidayModel.find({ clientId }).sort({ _id: -1 });
        }

        if (holidays.length === 0) {
            return res.send({
                data: [],
                message: "No Holiday Record Found",
                status: true
            });
        }

        return res.send({
            data: holidays,
            message: "Holiday Records Fetched Successfully",
            status: true
        });

    } catch (error) {
        await logException(error.message, 'getHolidays', clientIp, clientId);
        res.status(500).json({ status: false, error: error.message });
    }
};

exports.getHolidayById = async (req, res) => {
    const userData = req.user;
    const clientIp = req.clientIp;
    const clientId = userData.memberData.clientId;
    const holidayId = parseInt(req.params.id);
    const masterClientId = parseInt(process.env.MASTER_CLIENT_ID);

    try {
        let filter = { _id: holidayId };

        if (clientId !== masterClientId) {
            filter.clientId = clientId;
        }

        const holiday = await HolidayModel.findOne(filter);

        if (!holiday) {
            return res.send({
                data: [],
                message: "No Holiday Found",
                status: true
            });
        }

        return res.send({
            data: holiday,
            message: "Holiday Fetched Successfully",
            status: true
        });

    } catch (error) {
        await logException(error.message, 'getHolidayById', clientIp, clientId);
        res.status(500).json({ status: false, error: error.message });
    }
};

exports.updateHoliday = async (req, res) => {
    const userData = req.user;
    const clientIp = req.clientIp;
    const clientId = userData.memberData.clientId;
    const holidayId = parseInt(req.params.id);
    const masterClientId = parseInt(process.env.MASTER_CLIENT_ID);

    try {
        let filter = { _id: holidayId };

        if (clientId !== masterClientId) {
            filter.clientId = clientId;
        }

        const update = {
            ...req.body,
            updatorIp: clientIp,
            updatedBy: `${userData.memberData.firstName} ${userData.memberData.lastName}`
        };

        const updatedHoliday = await HolidayModel.findOneAndUpdate(filter, update, { new: true });

        if (!updatedHoliday) {
            return res.send({
                data: [],
                message: "No Holiday Found to Update",
                status: true
            });
        }

        return res.send({
            data: updatedHoliday,
            message: "Holiday Updated Successfully",
            status: true
        });

    } catch (error) {
        await logException(error.message, 'updateHoliday', clientIp, clientId);
        res.status(500).json({ status: false, error: error.message });
    }
};

exports.deleteHoliday = async (req, res) => {
    const userData = req.user;
    const clientIp = req.clientIp;
    const clientId = userData.memberData.clientId;
    const holidayId = parseInt(req.params.id);
    const masterClientId = parseInt(process.env.MASTER_CLIENT_ID);

    try {
        let filter = { _id: holidayId };

        if (clientId !== masterClientId) {
            filter.clientId = clientId;
        }

        const deletedHoliday = await HolidayModel.findOneAndDelete(filter);

        if (!deletedHoliday) {
            return res.send({
                data: [],
                message: "No Holiday Found to Delete",
                status: true
            });
        }

        return res.send({
            data: deletedHoliday,
            message: "Holiday Deleted Successfully",
            status: true
        });

    } catch (error) {
        await logException(error.message, 'deleteHoliday', clientIp, clientId);
        res.status(500).json({ status: false, error: error.message });
    }
};

exports.exportHoliday = async (req, res) => {
    const userData = req.user;
    const clientIp = req.clientIp;
    const clientId = userData.memberData.clientId;
    const masterClientId = parseInt(process.env.MASTER_CLIENT_ID);

    try {
        let holidays;

        if (clientId === masterClientId) {
            holidays = await HolidayModel.find().sort({ _id: -1 });
        } else {
            holidays = await HolidayModel.find({ clientId }).sort({ _id: -1 });
        }

        if (holidays.length === 0) {
            return res.send({
                data: [],
                message: "No Records Found To Export",
                status: true
            });
        }

        const holidayData = holidays.map(i => i.toObject());
        const fileBuffer = await excelFormatter.generateExcelBuffer(holidayData, 'Holiday');

        const attachments = [{
            filename: 'exported_holiday.xlsx',
            content: fileBuffer,
            encoding: 'base64'
        }];

        const emailText = emailTemplate.EXPORT_DATA_MAIL.replace('{{firstName}}', userData.memberData.firstName);

        await mailSender.sendEmailAttachment(
            userData.memberData.emailId,
            "Exported Holiday Records",
            emailText,
            attachments,
            clientIp,
            { isHtml: true }
        );

        return res.send({
            message: "Holiday Data Exported Successfully. Check Your Email.",
            status: true
        });

    } catch (error) {
        await logException(error.message, 'exportHoliday', clientIp, clientId);
        res.status(500).json({ status: false, error: error.message });
    }
};