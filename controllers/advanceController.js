const AdvanceModel = require('../models/advanceModel');
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

exports.createAdvance = async (req, res) => {
    const userData = req.user;
    const clientIp = req.clientIp;
    const clientId = userData.memberData.clientId;

    try {
        const savedAdvance = new AdvanceModel({
            ...req.body,
            creatorIp: clientIp,
            clientId: clientId,
            userId: userData.memberData._id,
            createdBy: `${userData.memberData.firstName} ${userData.memberData.lastName}`,
        });

        await savedAdvance.save();

        return res.send({
            data: savedAdvance,
            message: "Advance Created Successfully",
            status: true
        });

    } catch (error) {
        await logException(error.message, 'createAdvance', clientIp, clientId);
        res.status(500).json({ status: false, error: error.message });
    }
};

exports.getAdvances = async (req, res) => {
    const userData = req.user;
    const clientIp = req.clientIp;
    const clientId = userData.memberData.clientId;

    try {
        let advanceList;

        if (clientId === parseInt(process.env.MASTER_CLIENT_ID)) {
            advanceList = await AdvanceModel.find().sort({ _id: -1 });
        } else {
            advanceList = await AdvanceModel.find({ clientId }).sort({ _id: -1 });
        }

        return res.send({
            data: advanceList,
            message: "Advance Records Fetched Successfully",
            status: true
        });

    } catch (error) {
        await logException(error.message, 'getAdvances', clientIp, clientId);
        res.status(500).json({ status: false, error: error.message });
    }
};

exports.getAdvanceReports = async (req, res) => {
    const userData = req.user;
    const clientIp = req.clientIp;
    const clientId = userData.memberData.clientId;
    const userId = req.query.userId ? parseInt(req.query.userId) : null;

    try {
        let filter = {};

        if (clientId !== parseInt(process.env.MASTER_CLIENT_ID)) {
            filter.clientId = clientId;
        }

        if (userId) {
            filter.userId = userId;
        }

        const approvedCount = await AdvanceModel.countDocuments({ ...filter, isapproved: 1 });
        const unapprovedCount = await AdvanceModel.countDocuments({ ...filter, isunapproved: 1 });
        const appliedCount = await AdvanceModel.countDocuments({ ...filter, isapplied: 1 });

        const report = [
            { approved: approvedCount },
            { unapproved: unapprovedCount },
            { applied: appliedCount }
        ];

        return res.send({
            data: report,
            message: "Advance Report Fetched Successfully",
            status: true
        });

    } catch (error) {
        await logException(error.message, 'getAdvanceReports', clientIp, clientId);
        res.status(500).json({ status: false, error: error.message });
    }
};

exports.AdvanceDetailsById = async (req, res) => {
    const userData = req.user;
    const clientIp = req.clientIp;
    const clientId = userData.memberData.clientId;
    const id = parseInt(req.params.id);

    try {
        let filter = { _id: id};

        if (clientId !== parseInt(process.env.MASTER_CLIENT_ID)) {
            filter.clientId = clientId;
        }

        const advance = await AdvanceModel.findOne(filter);

        if (!advance) {
            return res.send({
                data: [],
                message: "Advance Not Found",
                status: false
            });
        }

        return res.send({
            data: advance,
            message: "Advance Details Fetched Successfully",
            status: true
        });

    } catch (error) {
        await logException(error.message, 'AdvanceDetailsById', clientIp, clientId);
        res.status(500).json({ status: false, error: error.message });
    }
};

exports.deleteAdvance = async (req, res) => {
    const userData = req.user;
    const clientIp = req.clientIp;
    const clientId = userData.memberData.clientId;
    const id = parseInt(req.params.id);

    try {
        let filter = { _id: id };

        if (clientId !== parseInt(process.env.MASTER_CLIENT_ID)) {
            filter.clientId = clientId;
        }

        const deleted = await AdvanceModel.deleteOne(filter);

        if (deleted.deletedCount === 0) {
            return res.send({
                status: false,
                message: "No Advance Record Found to Delete"
            });
        }

        return res.send({
            status: true,
            message: "Advance Deleted Successfully"
        });

    } catch (error) {
        await logException(error.message, 'deleteAdvanceById', clientIp, clientId);
        res.status(500).json({ status: false, error: error.message });
    }
};

exports.exportAdvance = async (req, res) => {
    const userData = req.user;
    const clientIp = req.clientIp;
    const clientId = userData.memberData.clientId;
    const masterClientId = parseInt(process.env.MASTER_CLIENT_ID);

    try {
        let advances;

        if (clientId === masterClientId) {
            advances = await AdvanceModel.find().sort({ _id: -1 });
        } else {
            advances = await AdvanceModel.find({ clientId }).sort({ _id: -1 });
        }

        if (advances.length === 0) {
            return res.send({
                data: [],
                message: "No Records Found To Export",
                status: true
            });
        }

        const advanceData = advances.map(item => item.toObject());
        const fileBuffer = await excelFormatter.generateExcelBuffer(advanceData, 'Advance');

        const attachments = [{
            filename: 'exported_advance.xlsx',
            content: fileBuffer,
            encoding: 'base64'
        }];

        const emailText = emailTemplate.EXPORT_DATA_MAIL.replace('{{firstName}}', userData.memberData.firstName);

        await mailSender.sendEmailAttachment(
            userData.memberData.emailId,
            "Exported Advance Records",
            emailText,
            attachments,
            clientIp,
            { isHtml: true }
        );

        return res.send({
            message: "Advance Data Exported Successfully. Check Your Email.",
            status: true
        });

    } catch (error) {
        await logException(error.message, 'exportAdvance', clientIp, clientId);
        res.status(500).json({ status: false, error: error.message });
    }
};