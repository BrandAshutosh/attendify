const UserModel = require('../models/userModel');
const Exception = require('../models/exceptionModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
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

exports.createUser = async (req, res) => {
    const userData = req.user;
    const clientIp = req.clientIp;
    const clientId = userData.memberData.clientId;

    try {
        const existingRecords = await UserModel.find({
            $or: [
                { mobile: req.body.mobile },
                { emailId: req.body.emailId },
            ]
        });

        if (existingRecords.length > 0) {
            let errorMessages = [];

            existingRecords.forEach(record => {
                if (record.mobile === req.body.mobile) errorMessages.push("Mobile Already Exists");
                if (record.emailId === req.body.emailId) errorMessages.push("EmailId Already Exists");
            });

            return res.status(400).json({
                status: false,
                message: `Duplicate Entry: ${[...new Set(errorMessages)].join(", ")}`
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.body.password, salt);

        const savedUser = new UserModel({
            ...req.body,
            password: hashedPassword,
            creatorIp: clientIp,
            clientId: clientId,
            createdBy: `${userData.memberData.firstName} ${userData.memberData.lastName}`,
        });

        await savedUser.save();

        const token = jwt.sign({ memberData: savedUser.toJSON() }, process.env.TOKEN_KEY, { expiresIn: '2d' });

        return res.send({
            data: {
                user: savedUser,
                token
            },
            message: "User Created Successfully",
            status: true
        });

    } catch (error) {
        await logException(error.message, 'createUser', clientIp, clientId);
        res.status(500).json({ status: false, error: error.message });
    }
};

exports.getUsers = async (req, res) => {
    const userData = req.user;
    const clientIp = req.clientIp;
    const clientId = userData.memberData.clientId;

    try {
        let Userlist;

        if (clientId === parseInt(process.env.MASTER_CLIENT_ID)) {
            Userlist = await UserModel.find().sort({ _id: -1 });
        } else {
            Userlist = await UserModel.find({ clientId: clientId }).sort({ _id: -1 });
        }

        if (Userlist.length === 0) {
            return res.send({
                data: [],
                message: "No User Record Found",
                status: true
            });
        }
        return res.send({
            data: Userlist,
            message: "User Fetched Successfully",
            status: true
        });

    } catch (error) {
        await logException(error.message, 'getUsers', clientIp, clientId);
        res.status(500).json({ status: false, error: error.message });
    }
};

exports.getUserById = async (req, res) => {
    const userData = req.user;
    const clientIp = req.clientIp;
    const clientId = userData.memberData.clientId;

    try {
        const Userlist = await UserModel.findOne({ _id: req.query.id, clientId: clientId });

        if (!Userlist) {
            return res.send({
                data: [],
                message: "No Record Found",
                status: true
            });
        } else {
            return res.send({
                data: Userlist,
                message: "User List Fetched Successfully",
                status: true
            });
        }
    } catch (error) {
        await logException(error.message, 'getUserById', clientIp, clientId);
        res.status(500).json({ status: false, error: error.message });
    }
};

exports.updateUser = async (req, res) => {
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

        let Userlist;

        if (clientId === parseInt(process.env.MASTER_CLIENT_ID)) {
            Userlist = await UserModel.findOneAndUpdate(
                { _id: req.query.id },
                updatedFields,
                { new: true }
            );
        } else {
            Userlist = await UserModel.findOneAndUpdate(
                { _id: req.query.id, clientId: clientId },
                updatedFields,
                { new: true }
            );
        }

        if (!Userlist) {
            return res.send({
                data: [],
                message: "No Record Found To Update",
                status: true
            });
        } else {
            return res.send({
                data: Userlist,
                message: "User Updated Successfully",
                status: true
            });
        }
    } catch (error) {
        await logException(error.message, 'updateUser', clientIp, clientId);
        res.status(500).json({ status: false, error: error.message });
    }
};

exports.deleteUser = async (req, res) => {
    const userData = req.user;
    const clientIp = req.clientIp;
    const clientId = userData.memberData.clientId;
    const masterClientId = parseInt(process.env.MASTER_CLIENT_ID);

    try {
        let ids = req.query.id.split(',').map(id => Number(id.trim()));
        let Userlist;

        if (clientId === masterClientId) {
            Userlist = await UserModel.find({ _id: { $in: ids } }).sort({ _id: -1 });
        } else {
            Userlist = await UserModel.find({ _id: { $in: ids }, clientId: clientId }).sort({ _id: -1 });
        }

        if (Userlist.length === 0) {
            return res.send({
                data: [],
                message: "No Records Found To Delete",
                status: true
            });
        }

        const UserlistData = Userlist.map(ip => ip.toObject());
        const fileBuffer = await excelFormatter.generateExcelBuffer(UserlistData, 'Users');

        const attachments = [{
            filename: 'deleted_users.xlsx',
            content: fileBuffer,
            encoding: 'base64'
        }];

        const emailText = emailTemplate.DELETE_DATA_MAIL.replace('{{firstName}}', userData.memberData.firstName);

        await mailSender.sendEmailAttachment(
            userData.memberData.emailId,
            "User Records Deletion",
            emailText,
            attachments,
            clientIp,
            { isHtml: true }
        );

        const deletedUserlists = await UserModel.deleteMany({ _id: { $in: ids } });

        return res.send({
            count: deletedUserlists.deletedCount,
            message: "User Deleted Successfully",
            status: true
        });

    } catch (error) {
        await logException(error.message, 'deleteUser', clientIp, clientId);
        res.status(500).json({ status: false, error: error.message });
    }
};

exports.exportUserlist = async (req, res) => {
    const userData = req.user;
    const clientIp = req.clientIp;
    const clientId = userData.memberData.clientId;
    const masterClientId = parseInt(process.env.MASTER_CLIENT_ID);

    try {
        let Userlists;

        if (clientId === masterClientId) {
            Userlists = await UserModel.find().sort({ _id: -1 });
        } else {
            Userlists = await UserModel.find({ clientId: clientId }).sort({ _id: -1 });
        }

        if (Userlists.length === 0) {
            return res.send({
                data: [],
                message: "No Records Found To Export",
                status: true
            });
        }

        const UserlistData = Userlists.map(ip => ip.toObject());
        const fileBuffer = await excelFormatter.generateExcelBuffer(UserlistData, 'Users');

        const attachments = [{
            filename: 'exported_users.xlsx',
            content: fileBuffer,
            encoding: 'base64'
        }];

        const emailText = emailTemplate.EXPORT_DATA_MAIL.replace('{{firstName}}', userData.memberData.firstName);

        await mailSender.sendEmailAttachment(
            userData.memberData.emailId,
            "Exported Users Records",
            emailText,
            attachments,
            clientIp,
            { isHtml: true }
        );

        return res.send({
            message: "Users Data Exported Successfully. Check Your Email.",
            status: true
        });

    } catch (error) {
        await logException(error.message, 'exportUserlist', clientIp, clientId);
        res.status(500).json({ status: false, error: error.message });
    }
};

exports.getManagers = async (req, res) => {
    const userData = req.user;
    const clientIp = req.clientIp;
    const clientId = userData.memberData.clientId;
    const userId = parseInt(req.query.userId);

    try {

        let managerList = [];
        let currentUser = await UserModel.findOne({ _id: userId, clientId });

        if (!currentUser) {
            return res.send({
                data: [],
                message: "No User Found with the given ID",
                status: true
            });
        }

        managerList.push(currentUser);
      
        while (currentUser && currentUser.reportingToId) {
            const reportingToUser = await UserModel.findOne({
                _id: currentUser.reportingToId,
                clientId
            });

            if (reportingToUser) {
                managerList.push(reportingToUser);
                if (reportingToUser._id === 1) break;
                currentUser = reportingToUser;
            } else {
                break;
            }
        }

        return res.send({
            data: managerList.reverse(),
            message: "User & Managers Fetched Successfully",
            status: true
        });

    } catch (error) {
        await logException(error.message, 'getManagers', clientIp, clientId);
        res.status(500).json({ status: false, error: error.message });
    }
};