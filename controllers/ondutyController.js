const OnDutyModel = require('../models/ondutyModel');
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

exports.createOnDuty = async (req, res) => {
    const userData = req.user;
    const clientIp = req.clientIp;
    const clientId = userData.memberData.clientId;

    try {   
        const savedOnDuty = new OnDutyModel({
            ...req.body,
            creatorIp: clientIp,
            clientId: clientId,
            createdBy: `${userData.memberData.firstName} ${userData.memberData.lastName}`,
        });

        await savedOnDuty.save();

        return res.send({
            data: savedOnDuty,
            message: "OnDuty Record Created Successfully",
            status: true
        });

    } catch (error) {
        await logException(error.message, 'createOnDuty', clientIp, clientId);
        res.status(500).json({ status: false, error: error.message });
    }
};

exports.getOnDuties = async (req, res) => {
    const userData = req.user;
    const clientIp = req.clientIp;
    const clientId = userData.memberData.clientId;

    try {
        let OnDutyList;

        if (clientId === parseInt(process.env.MASTER_CLIENT_ID)) {
            OnDutyList = await OnDutyModel.find().sort({ _id: -1 });
        } else {
            OnDutyList = await OnDutyModel.find({ clientId: clientId }).sort({ _id: -1 });
        }

        if (OnDutyList.length === 0) {
            return res.send({
                data: [],
                message: "No OnDuty Records Found",
                status: true
            });
        }

        return res.send({
            data: OnDutyList,
            message: "OnDuty Records Fetched Successfully",
            status: true
        });

    } catch (error) {
        await logException(error.message, 'getOnDuties', clientIp, clientId);
        res.status(500).json({ status: false, error: error.message });
    }
};

exports.getOnDutyById = async (req, res) => {
    const userData = req.user;
    const clientIp = req.clientIp;
    const clientId = userData.memberData.clientId;

    try {
        const onDuty = await OnDutyModel.findOne({ _id: req.query.id, clientId: clientId });

        if (!onDuty) {
            return res.send({
                data: [],
                message: "No Record Found",
                status: true
            });
        }

        return res.send({
            data: onDuty,
            message: "OnDuty Record Fetched Successfully",
            status: true
        });

    } catch (error) {
        await logException(error.message, 'getOnDutyById', clientIp, clientId);
        res.status(500).json({ status: false, error: error.message });
    }
};

exports.updateOnDuty = async (req, res) => {
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

        let onDuty;

        if (clientId === parseInt(process.env.MASTER_CLIENT_ID)) {
            onDuty = await OnDutyModel.findOneAndUpdate(
                { _id: req.query.id },
                updatedFields,
                { new: true }
            );
        } else {
            onDuty = await OnDutyModel.findOneAndUpdate(
                { _id: req.query.id, clientId: clientId },
                updatedFields,
                { new: true }
            );
        }

        if (!onDuty) {
            return res.send({
                data: [],
                message: "No Record Found To Update",
                status: true
            });
        }

        return res.send({
            data: onDuty,
            message: "OnDuty Record Updated Successfully",
            status: true
        });

    } catch (error) {
        await logException(error.message, 'updateOnDuty', clientIp, clientId);
        res.status(500).json({ status: false, error: error.message });
    }
};

exports.deleteOnDuty = async (req, res) => {
    const userData = req.user;
    const clientIp = req.clientIp;
    const clientId = userData.memberData.clientId;
    const masterClientId = parseInt(process.env.MASTER_CLIENT_ID);

    try {
        let ids = req.query.id.split(',').map(id => Number(id.trim()));
        let onDutyList;

        if (clientId === masterClientId) {
            onDutyList = await OnDutyModel.find({ _id: { $in: ids } }).sort({ _id: -1 });
        } else {
            onDutyList = await OnDutyModel.find({ _id: { $in: ids }, clientId: clientId }).sort({ _id: -1 });
        }

        if (onDutyList.length === 0) {
            return res.send({
                data: [],
                message: "No Records Found To Delete",
                status: true
            });
        }

        const OnDutyData = onDutyList.map(record => record.toObject());
        const fileBuffer = await excelFormatter.generateExcelBuffer(OnDutyData, 'OnDuty Records');

        const attachments = [{
            filename: 'deleted_onduties.xlsx',
            content: fileBuffer,
            encoding: 'base64'
        }];

        const emailText = emailTemplate.DELETE_DATA_MAIL.replace('{{firstName}}', userData.memberData.firstName);

        await mailSender.sendEmailAttachment(
            userData.memberData.emailId,
            "OnDuty Record Deletion",
            emailText,
            attachments,
            clientIp,
            { isHtml: true }
        );

        const deleted = await OnDutyModel.deleteMany({ _id: { $in: ids } });

        return res.send({
            count: deleted.deletedCount,
            message: "OnDuty Record(s) Deleted Successfully",
            status: true
        });

    } catch (error) {
        await logException(error.message, 'deleteOnDuty', clientIp, clientId);
        res.status(500).json({ status: false, error: error.message });
    }
};

exports.exportOnDuties = async (req, res) => {
    const userData = req.user;
    const clientIp = req.clientIp;
    const clientId = userData.memberData.clientId;
    const masterClientId = parseInt(process.env.MASTER_CLIENT_ID);

    try {
        let onDutyList;

        if (clientId === masterClientId) {
            onDutyList = await OnDutyModel.find().sort({ _id: -1 });
        } else {
            onDutyList = await OnDutyModel.find({ clientId: clientId }).sort({ _id: -1 });
        }

        if (onDutyList.length === 0) {
            return res.send({
                data: [],
                message: "No Records Found To Export",
                status: true
            });
        }

        const OnDutyData = onDutyList.map(record => record.toObject());
        const fileBuffer = await excelFormatter.generateExcelBuffer(OnDutyData, 'OnDuty Export');

        const attachments = [{
            filename: 'exported_onduties.xlsx',
            content: fileBuffer,
            encoding: 'base64'
        }];

        const emailText = emailTemplate.EXPORT_DATA_MAIL.replace('{{firstName}}', userData.memberData.firstName);

        await mailSender.sendEmailAttachment(
            userData.memberData.emailId,
            "Exported OnDuty Records",
            emailText,
            attachments,
            clientIp,
            { isHtml: true }
        );

        return res.send({
            message: "OnDuty Records Exported Successfully. Check Your Email.",
            status: true
        });

    } catch (error) {
        await logException(error.message, 'exportOnDuties', clientIp, clientId);
        res.status(500).json({ status: false, error: error.message });
    }
};