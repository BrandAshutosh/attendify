const VehicleModel = require('../models/vehicleModel');
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

exports.createVehicle = async (req, res) => {
    const userData = req.user;
    const clientIp = req.clientIp;
    const clientId = userData.memberData.clientId;
    const userId = userData.memberData._id;

    try {
        const existingVehicle = await VehicleModel.findOne({ userId, clientId });

        if (existingVehicle) {
            existingVehicle.set({
                ...req.body,
                updatedBy: `${userData.memberData.firstName} ${userData.memberData.lastName}`,
                updatorIp: clientIp
            });

            await existingVehicle.save();

            return res.send({
                data: existingVehicle,
                message: "Vehicle Updated Successfully",
                status: true
            });

        } else {
            const newVehicle = new VehicleModel({
                ...req.body,
                creatorIp: clientIp,
                clientId: clientId,
                userId: userId,
                createdBy: `${userData.memberData.firstName} ${userData.memberData.lastName}`,
            });

            await newVehicle.save();

            return res.send({
                data: newVehicle,
                message: "Vehicle Created Successfully",
                status: true
            });
        }

    } catch (error) {
        await logException(error.message, 'createVehicle', clientIp, clientId);
        res.status(500).json({ status: false, error: error.message });
    }
};

exports.getVehicles = async (req, res) => {
    const userData = req.user;
    const clientIp = req.clientIp;
    const clientId = userData.memberData.clientId;

    try {
        let vehicleList;

        if (clientId === parseInt(process.env.MASTER_CLIENT_ID)) {
            vehicleList = await VehicleModel.find().sort({ _id: -1 });
        } else {
            vehicleList = await VehicleModel.find({ clientId: clientId }).sort({ _id: -1 });
        }

        if (vehicleList.length === 0) {
            return res.send({
                data: [],
                message: "No Vehicle Record Found",
                status: true
            });
        }

        return res.send({
            data: vehicleList,
            message: "Vehicle Fetched Successfully",
            status: true
        });

    } catch (error) {
        await logException(error.message, 'getVehicles', clientIp, clientId);
        res.status(500).json({ status: false, error: error.message });
    }
};

exports.getVehicleByUserId = async (req, res) => {
    const userData = req.user;
    const clientIp = req.clientIp;
    const clientId = userData.memberData.clientId;
    const userId = parseInt(req.query.userId);

    try {
        const vehicle = await VehicleModel.findOne({ clientId: clientId, userId: userId });

        if (!vehicle) {
            return res.send({
                data: null,
                message: "No Vehicle Record Found for This User",
                status: true
            });
        }

        return res.send({
            data: vehicle,
            message: "Vehicle Fetched Successfully",
            status: true
        });

    } catch (error) {
        await logException(error.message, 'getVehicleByUserId', clientIp, clientId);
        res.status(500).json({ status: false, error: error.message });
    }
};

exports.getVehicleDetailsById = async (req, res) => {
    const userData = req.user;
    const clientIp = req.clientIp;
    const clientId = userData.memberData.clientId;
    const vehicleId = parseInt(req.params.id);

    try {
        let filter = { _id: vehicleId };

        if (clientId !== parseInt(process.env.MASTER_CLIENT_ID)) {
            filter.clientId = clientId;
        }

        const vehicle = await VehicleModel.findOne(filter);

        if (!vehicle) {
            return res.send({
                data: [],
                message: "No Vehicle Record Found",
                status: true
            });
        }

        return res.send({
            data: vehicle,
            message: "Vehicle Details Fetched Successfully",
            status: true
        });

    } catch (error) {
        await logException(error.message, 'vehicleDetailsById', clientIp, clientId);
        res.status(500).json({ status: false, error: error.message });
    }
};

exports.updateVehicle = async (req, res) => {
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

        let vehicle;

        if (clientId === parseInt(process.env.MASTER_CLIENT_ID)) {
            vehicle = await VehicleModel.findOneAndUpdate(
                { _id: req.query.id },
                updatedFields,
                { new: true }
            );
        } else {
            vehicle = await VehicleModel.findOneAndUpdate(
                { _id: req.query.id, clientId: clientId },
                updatedFields,
                { new: true }
            );
        }

        if (!vehicle) {
            return res.send({
                data: [],
                message: "No Record Found To Update",
                status: true
            });
        } else {
            return res.send({
                data: vehicle,
                message: "Vehicle Updated Successfully",
                status: true
            });
        }
    } catch (error) {
        await logException(error.message, 'updateVehicle', clientIp, clientId);
        res.status(500).json({ status: false, error: error.message });
    }
};

exports.deleteVehicle = async (req, res) => {
    const userData = req.user;
    const clientIp = req.clientIp;
    const clientId = userData.memberData.clientId;
    const masterClientId = parseInt(process.env.MASTER_CLIENT_ID);

    try {
        let ids = req.query.id.split(',').map(id => Number(id.trim()));
        let vehicle;

        if (clientId === masterClientId) {
            vehicle = await VehicleModel.find({ _id: { $in: ids } }).sort({ _id: -1 });
        } else {
            vehicle = await VehicleModel.find({ _id: { $in: ids }, clientId: clientId }).sort({ _id: -1 });
        }

        if (vehicle.length === 0) {
            return res.send({
                data: [],
                message: "No Records Found To Delete",
                status: true
            });
        }

        const vehicleData = vehicle.map(ip => ip.toObject());
        const fileBuffer = await excelFormatter.generateExcelBuffer(vehicleData, 'vehicle');

        const attachments = [{
            filename: 'deleted_vehicle.xlsx',
            content: fileBuffer,
            encoding: 'base64'
        }];

        const emailText = emailTemplate.DELETE_DATA_MAIL.replace('{{firstName}}', userData.memberData.firstName);

        await mailSender.sendEmailAttachment(
            userData.memberData.emailId,
            "Vehicle Records Deletion",
            emailText,
            attachments,
            clientIp,
            { isHtml: true }
        );

        const deletedVehicle = await VehicleModel.deleteMany({ _id: { $in: ids } });

        return res.send({
            count: deletedVehicle.deletedCount,
            message: "Vehicle Deleted Successfully",
            status: true
        });

    } catch (error) {
        await logException(error.message, 'deleteVehicle', clientIp, clientId);
        res.status(500).json({ status: false, error: error.message });
    }
};

exports.exportVehicles = async (req, res) => {
    const userData = req.user;
    const clientIp = req.clientIp;
    const clientId = userData.memberData.clientId;
    const masterClientId = parseInt(process.env.MASTER_CLIENT_ID);

    try {
        let vehicles;

        if (clientId === masterClientId) {
            vehicles = await VehicleModel.find().sort({ _id: -1 });
        } else {
            vehicles = await VehicleModel.find({ clientId: clientId }).sort({ _id: -1 });
        }

        if (vehicles.length === 0) {
            return res.send({
                data: [],
                message: "No Records Found To Export",
                status: true
            });
        }

        const vehicleData = vehicles.map(ip => ip.toObject());
        const fileBuffer = await excelFormatter.generateExcelBuffer(vehicleData, 'vehicle');

        const attachments = [{
            filename: 'exported_vehicle.xlsx',
            content: fileBuffer,
            encoding: 'base64'
        }];

        const emailText = emailTemplate.EXPORT_DATA_MAIL.replace('{{firstName}}', userData.memberData.firstName);

        await mailSender.sendEmailAttachment(
            userData.memberData.emailId,
            "Exported Vehicle Records",
            emailText,
            attachments,
            clientIp,
            { isHtml: true }
        );

        return res.send({
            message: "Vehicle Data Exported Successfully. Check Your Email.",
            status: true
        });

    } catch (error) {
        await logException(error.message, 'exportVehicle', clientIp, clientId);
        res.status(500).json({ status: false, error: error.message });
    }
};