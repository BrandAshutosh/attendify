const DeviceManager = require('../models/devicemanagerModel');
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


exports.createDeviceManager = async (req, res) => {
    const userData = req.user;
    const clientIp = req.clientIp;
    const clientId = userData.memberData.clientId;

    try {
        const query = {
            ...req.body,
            clientId: clientId
        };

        const update = {
            ...req.body,
            creatorIp: clientIp,
            clientId: clientId,
            createdBy: `${userData.memberData.firstName} ${userData.memberData.lastName}`,
        };

        const options = { new: true, upsert: true }; 

        const savedDevice = await DeviceManager.findOneAndUpdate(query, update, options);

        return res.send({
            data: savedDevice,
            message: "Device Record Created or Updated Successfully",
            status: true
        });

    } catch (error) {
        await logException(error.message, 'createDeviceManager', clientIp, clientId);
        res.status(500).json({ status: false, error: error.message });
    }
};


exports.getDeviceManagers = async (req, res) => {
    const userData = req.user;
    const clientIp = req.clientIp;
    const clientId = userData.memberData.clientId;

    try {
        let list;

        if (clientId === parseInt(process.env.MASTER_CLIENT_ID)) {
            list = await DeviceManager.find().sort({ _id: -1 });
        } else {
            list = await DeviceManager.find({ clientId: clientId }).sort({ _id: -1 });
        }

        if (list.length === 0) {
            return res.send({
                data: [],
                message: "No Device Record Found",
                status: true
            });
        }

        return res.send({
            data: list,
            message: "Device Records Fetched Successfully",
            status: true
        });

    } catch (error) {
        await logException(error.message, 'getAllDeviceManagers', clientIp, clientId);
        res.status(500).json({ status: false, error: error.message });
    }
};

exports.getDeviceManagerById = async (req, res) => {
    const userData = req.user;
    const clientIp = req.clientIp;
    const clientId = userData.memberData.clientId;
    const id = parseInt(req.query.id);

    try {
        let filter = { _id: id };

        if (clientId !== parseInt(process.env.MASTER_CLIENT_ID)) {
            filter.clientId = clientId;
        }

        const device = await DeviceManager.findOne(filter);

        if (!device) {
            return res.send({
                status: false,
                message: "No Device Record Found"
            });
        }

        return res.send({
            data: device,
            message: "Device Record Fetched Successfully",
            status: true
        });

    } catch (error) {
        await logException(error.message, 'getDeviceManagerById', clientIp, clientId);
        res.status(500).json({ status: false, error: error.message });
    }
};

exports.getDeviceManagerByUserId = async (req, res) => {
    const userData = req.user;
    const clientIp = req.clientIp;
    const clientId = userData.memberData.clientId;
    const userId = parseInt(req.query.userId);

    try {
        let filter = { userId: userId };

        if (clientId !== parseInt(process.env.MASTER_CLIENT_ID)) {
            filter.clientId = clientId;
        }

        const device = await DeviceManager.findOne(filter);

        if (!device) {
            return res.send({
                status: false,
                message: "No Device Record Found"
            });
        }

        return res.send({
            data: device,
            message: "Device Record Fetched Successfully",
            status: true
        });

    } catch (error) {
        await logException(error.message, 'getDeviceManagerByUserId', clientIp, clientId);
        res.status(500).json({ status: false, error: error.message });
    }
};

exports.exportDeviceManager = async (req, res) => {
    const userData = req.user;
    const clientIp = req.clientIp;
    const clientId = userData.memberData.clientId;
    const masterClientId = parseInt(process.env.MASTER_CLIENT_ID);

    try {
        let records;

        if (clientId === masterClientId) {
            records = await DeviceManager.find().sort({ _id: -1 });
        } else {
            records = await DeviceManager.find({ clientId: clientId }).sort({ _id: -1 });
        }

        if (records.length === 0) {
            return res.send({
                data: [],
                message: "No Records Found To Export",
                status: true
            });
        }

        const deviceData = records.map(ip => ip.toObject());
        const fileBuffer = await excelFormatter.generateExcelBuffer(deviceData, 'DeviceManager');

        const attachments = [{
            filename: 'exported_device_manager.xlsx',
            content: fileBuffer,
            encoding: 'base64'
        }];

        const emailText = emailTemplate.EXPORT_DATA_MAIL.replace('{{firstName}}', userData.memberData.firstName);

        await mailSender.sendEmailAttachment(
            userData.memberData.emailId,
            "Exported Device Manager Records",
            emailText,
            attachments,
            clientIp,
            { isHtml: true }
        );

        return res.send({
            message: "Device Manager Data Exported Successfully. Check Your Email.",
            status: true
        });

    } catch (error) {
        await logException(error.message, 'exportDeviceManager', clientIp, clientId);
        res.status(500).json({ status: false, error: error.message });
    }
};

exports.deleteDeviceManager = async (req, res) => {
    const userData = req.user;
    const clientIp = req.clientIp;
    const clientId = userData.memberData.clientId;
    const deviceId = parseInt(req.params.id);

    try {
        const device = await DeviceManager.findOneAndDelete({
            _id: deviceId,
            ...(clientId !== parseInt(process.env.MASTER_CLIENT_ID) && { clientId: clientId })
        });

        if (!device) {
            return res.send({
                status: false,
                message: "No Device Record Found To Delete"
            });
        }

        return res.send({
            message: "Device Record Deleted Successfully",
            status: true
        });

    } catch (error) {
        await logException(error.message, 'deleteDeviceManager', clientIp, clientId);
        res.status(500).json({ status: false, error: error.message });
    }
};
