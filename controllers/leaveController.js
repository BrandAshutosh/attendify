const LeaveModel = require('../models/leaveModel');
const LeaveBalanceModel = require('../models/leavebalanceModel');
const UserModel = require('../models/userModel');
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

exports.createLeave = async (req, res) => {
    const userData = req.user;
    const clientIp = req.clientIp;
    const clientId = userData.memberData.clientId;

    try {
        const savedUser = new LeaveModel({
            ...req.body,
            creatorIp: clientIp,
            clientId: clientId,
            userId: userData.memberData._id,
            createdBy: `${userData.memberData.firstName} ${userData.memberData.lastName}`,
        });

        await savedUser.save();
        return res.send({
            data: savedUser,
            message: "Leave Created Successfully",
            status: true
        });

    } catch (error) {
        await logException(error.message, 'createLeave', clientIp, clientId);
        res.status(500).json({ status: false, error: error.message });
    }
};

exports.getLeaves = async (req, res) => {
    const userData = req.user;
    const clientIp = req.clientIp;
    const clientId = userData.memberData.clientId;

    try {
        let leavelist;

        if (clientId === parseInt(process.env.MASTER_CLIENT_ID)) {
            leavelist = await LeaveModel.find().sort({ _id: -1 });
        } else {
            leavelist = await LeaveModel.find({ clientId: clientId }).sort({ _id: -1 });
        }

        if (leavelist.length === 0) {
            return res.send({
                data: [],
                message: "No Leave Record Found",
                status: true
            });
        }

        return res.send({
            data: leavelist,
            message: "Leave Fetched Successfully",
            status: true
        });

    } catch (error) {
        await logException(error.message, 'getLeaves', clientIp, clientId);
        res.status(500).json({ status: false, error: error.message });
    }
};

exports.getLeaveReports = async (req, res) => {
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

        const approvedCount = await LeaveModel.countDocuments({ ...filter, isapproved: true });
        const unapprovedCount = await LeaveModel.countDocuments({ ...filter, isunapproved: true });
        const appliedCount = await LeaveModel.countDocuments({ ...filter, isapplied: true });

        const report = [
            { approved: approvedCount },
            { unapproved: unapprovedCount },
            { applied: appliedCount }
        ];

        return res.send({
            data: report,
            message: "Leave Report Fetched Successfully",
            status: true
        });

    } catch (error) {
        await logException(error.message, 'getReports', clientIp, clientId);
        res.status(500).json({ status: false, error: error.message });
    }
};

exports.leaveDetailsById = async (req, res) => {
    const userData = req.user;
    const clientIp = req.clientIp;
    const clientId = userData.memberData.clientId;
    const leaveId = parseInt(req.params.id);

    try {
        let filter = { _id: leaveId };

        if (clientId !== parseInt(process.env.MASTER_CLIENT_ID)) {
            filter.clientId = clientId;
        }

        const leave = await LeaveModel.findOne(filter);

        if (!leave) {
            return res.send({
                data: [],
                message: "No Leave Record Found",
                status: true
            });
        }

        return res.send({
            data: leave,
            message: "Leave Details Fetched Successfully",
            status: true
        });

    } catch (error) {
        await logException(error.message, 'leaveDetailsById', clientIp, clientId);
        res.status(500).json({ status: false, error: error.message });
    }
};

exports.getLeaveById = async (req, res) => {
    const userData = req.user;
    const clientIp = req.clientIp;
    const clientId = userData.memberData.clientId;

    try {
        const leave = await LeaveModel.findOne({ _id: req.query.id, clientId: clientId });

        if (!leave) {
            return res.send({
                data: [],
                message: "No Record Found",
                status: true
            });
        } else {
            return res.send({
                data: leave,
                message: "Leave Fetched Successfully",
                status: true
            });
        }
    } catch (error) {
        await logException(error.message, 'getLeaveById', clientIp, clientId);
        res.status(500).json({ status: false, error: error.message });
    }
};

exports.updateLeave = async (req, res) => {
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

        let leave;

        if (clientId === parseInt(process.env.MASTER_CLIENT_ID)) {
            leave = await LeaveModel.findOneAndUpdate(
                { _id: req.query.id },
                updatedFields,
                { new: true }
            );
        } else {
            leave = await LeaveModel.findOneAndUpdate(
                { _id: req.query.id, clientId: clientId },
                updatedFields,
                { new: true }
            );
        }

        if (!leave) {
            return res.send({
                data: [],
                message: "No Record Found To Update",
                status: true
            });
        } else {
            return res.send({
                data: leave,
                message: "Leave Updated Successfully",
                status: true
            });
        }
    } catch (error) {
        await logException(error.message, 'updateLeave', clientIp, clientId);
        res.status(500).json({ status: false, error: error.message });
    }
};

exports.deleteLeave = async (req, res) => {
    const userData = req.user;
    const clientIp = req.clientIp;
    const clientId = userData.memberData.clientId;
    const masterClientId = parseInt(process.env.MASTER_CLIENT_ID);

    try {
        let ids = req.query.id.split(',').map(id => Number(id.trim()));
        let leave;

        if (clientId === masterClientId) {
            leave = await LeaveModel.find({ _id: { $in: ids } }).sort({ _id: -1 });
        } else {
            leave = await LeaveModel.find({ _id: { $in: ids }, clientId: clientId }).sort({ _id: -1 });
        }

        if (leave.length === 0) {
            return res.send({
                data: [],
                message: "No Records Found To Delete",
                status: true
            });
        }

        const leaveData = leave.map(ip => ip.toObject());
        const fileBuffer = await excelFormatter.generateExcelBuffer(leaveData, 'leave');

        const attachments = [{
            filename: 'deleted_leave.xlsx',
            content: fileBuffer,
            encoding: 'base64'
        }];

        const emailText = emailTemplate.DELETE_DATA_MAIL.replace('{{firstName}}', userData.memberData.firstName);

        await mailSender.sendEmailAttachment(
            userData.memberData.emailId,
            "Leave Records Deletion",
            emailText,
            attachments,
            clientIp,
            { isHtml: true }
        );

        const deletedLeave = await LeaveModel.deleteMany({ _id: { $in: ids } });

        return res.send({
            count: deletedLeave.deletedCount,
            message: "Leave Deleted Successfully",
            status: true
        });

    } catch (error) {
        await logException(error.message, 'deleteLeave', clientIp, clientId);
        res.status(500).json({ status: false, error: error.message });
    }
};

exports.exportLeave = async (req, res) => {
    const userData = req.user;
    const clientIp = req.clientIp;
    const clientId = userData.memberData.clientId;
    const masterClientId = parseInt(process.env.MASTER_CLIENT_ID);

    try {
        let leaves;

        if (clientId === masterClientId) {
            leaves = await LeaveModel.find().sort({ _id: -1 });
        } else {
            leaves = await LeaveModel.find({ clientId: clientId }).sort({ _id: -1 });
        }

        if (leaves.length === 0) {
            return res.send({
                data: [],
                message: "No Records Found To Export",
                status: true
            });
        }

        const leaveData = leaves.map(ip => ip.toObject());
        const fileBuffer = await excelFormatter.generateExcelBuffer(leaveData, 'Leave');

        const attachments = [{
            filename: 'exported_leave.xlsx',
            content: fileBuffer,
            encoding: 'base64'
        }];

        const emailText = emailTemplate.EXPORT_DATA_MAIL.replace('{{firstName}}', userData.memberData.firstName);

        await mailSender.sendEmailAttachment(
            userData.memberData.emailId,
            "Exported Leave Records",
            emailText,
            attachments,
            clientIp,
            { isHtml: true }
        );

        return res.send({
            message: "Leave Data Exported Successfully. Check Your Email.",
            status: true
        });

    } catch (error) {
        await logException(error.message, 'exportLeave', clientIp, clientId);
        res.status(500).json({ status: false, error: error.message });
    }
};

exports.getLeaveBalanceReport = async (req, res) => {
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

        const leaveBalance = await LeaveBalanceModel.findOne(filter);

        if (!leaveBalance) {
            return res.send({
                data: [],
                message: "No Leave Balance Record Found",
                status: true
            });
        }

        return res.send({
            data: [leaveBalance],
            message: "Leave Balance Report Fetched Successfully",
            status: true
        });

    } catch (error) {
        await logException(error.message, 'getLeaveBalanceReport', clientIp, clientId);
        res.status(500).json({ status: false, error: error.message });
    }
};

exports.processMonthlyLeave = async (req, res) => {
    try {
        const users = await UserModel.find({ isActive: 1 });

        for (const user of users) {
            const existing = await LeaveBalanceModel.findOne({ userId: user._id });

            if (existing) {
                await LeaveBalanceModel.updateOne(
                    { userId: user._id },
                    {
                        $inc: {
                            casualLeave: 1,
                            sickLeave: 0.5,
                            earnedLeave: 1.5
                        }
                    }
                );
            } else {
                await LeaveBalanceModel.create({
                    clientId: user.clientId,
                    userId: user._id,
                    earnedLeave: 1.5,
                    sickLeave: 0.5,
                    casualLeave: 1,
                    createdBy: 'System',
                    updatedBy: 'System',
                    creatorIp: 'AUTO',
                    updatorIp: 'AUTO'
                });
            }
        }
        console.log('Monthly Leave Credits Processed Successfully');
    } catch (error) {
        console.error('Monthly leave credit error:', error.message);
    }
};

exports.createOnDuty = async (req, res) => {
    const userData = req.user;
    const clientIp = req.clientIp;
    const clientId = userData.memberData.clientId;

    try {
        const savedOnDuty = new OnDutyModel({
            ...req.body,
            clientId: clientId,
            userId: userData.memberData._id,
            username: `${userData.memberData.firstName} ${userData.memberData.lastName}`,
            creatorIp: clientIp,
            createdBy: `${userData.memberData.firstName} ${userData.memberData.lastName}`,
        });

        await savedOnDuty.save();
        return res.send({
            data: savedOnDuty,
            message: "On Duty Created Successfully",
            status: true
        });

    } catch (error) {
        await logException(error.message, 'createOnDuty', clientIp, clientId);
        res.status(500).json({ status: false, error: error.message });
    }
};

exports.getOnDutyReports = async (req, res) => {
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

        const approvedCount = await OnDutyModel.countDocuments({ ...filter, isapproved: true });
        const unapprovedCount = await OnDutyModel.countDocuments({ ...filter, isunapproved: true });
        const appliedCount = await OnDutyModel.countDocuments({ ...filter, isapplied: true });

        const report = [
            { approved: approvedCount },
            { unapproved: unapprovedCount },
            { applied: appliedCount }
        ];

        return res.send({
            data: report,
            message: "On Duty Report Fetched Successfully",
            status: true
        });

    } catch (error) {
        await logException(error.message, 'getOnDutyReports', clientIp, clientId);
        res.status(500).json({ status: false, error: error.message });
    }
};

exports.onDutyDetailsById = async (req, res) => {
    const userData = req.user;
    const clientIp = req.clientIp;
    const clientId = userData.memberData.clientId;
    const ondutyId = parseInt(req.params.id);

    try {
        let filter = { _id: ondutyId };

        if (clientId !== parseInt(process.env.MASTER_CLIENT_ID)) {
            filter.clientId = clientId;
        }

        const onduty = await OnDutyModel.findOne(filter);

        if (!onduty) {
            return res.send({
                data: [],
                message: "No On Duty Record Found",
                status: true
            });
        }

        return res.send({
            data: onduty,
            message: "On Duty Details Fetched Successfully",
            status: true
        });

    } catch (error) {
        await logException(error.message, 'onDutyById', clientIp, clientId);
        res.status(500).json({ status: false, error: error.message });
    }
};
