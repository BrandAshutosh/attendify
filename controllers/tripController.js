const TripModel = require('../models/tripModel');
const Exception = require('../models/exceptionModel');

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

exports.createTrip = async (req, res) => {
    const userData = req.user;
    const clientIp = req.clientIp;
    const clientId = userData.memberData.clientId;

    try {
        const { tripPoints, startTime, endTime, userId, isapplied } = req.body;

        if (!tripPoints || tripPoints.length === 0) {
            return res.status(400).json({
                status: false,
                message: "Trip path data is required"
            });
        }

        const trip = new TripModel({
            userId,
            clientId,
            tripPoints,
            startTime,
            endTime,
            isapplied,
            createdBy: `${userData.memberData.firstName} ${userData.memberData.lastName}`,
            creatorIp: clientIp
        });

        await trip.save();

        return res.send({
            data: trip,
            message: "Trip saved successfully",
            status: true
        });

    } catch (error) {
        await logException(error.message, 'createTrip', clientIp, clientId);
        res.status(500).json({ status: false, error: error.message });
    }
};

exports.getTrips = async (req, res) => {
    const userData = req.user;
    const clientIp = req.clientIp;
    const clientId = userData.memberData.clientId;

    try {
        let trips;

        if (clientId === parseInt(process.env.MASTER_CLIENT_ID)) {
            trips = await TripModel.find().sort({ _id: -1 });
        } else {
            trips = await TripModel.find({ clientId }).sort({ _id: -1 });
        }

        return res.send({
            data: trips,
            message: "Trips fetched successfully",
            status: true
        });

    } catch (error) {
        await logException(error.message, 'getTrips', clientIp, clientId);
        res.status(500).json({ status: false, error: error.message });
    }
};

exports.getTripById = async (req, res) => {
    const userData = req.user;
    const clientIp = req.clientIp;
    const clientId = userData.memberData.clientId;

    try {
        const trip = await TripModel.findOne({
            _id: req.query.id,
            clientId
        });

        if (!trip) {
            return res.send({
                data: [],
                message: "No Record Found",
                status: true
            });
        }

        return res.send({
            data: trip,
            message: "Trip fetched successfully",
            status: true
        });

    } catch (error) {
        await logException(error.message, 'getTripById', clientIp, clientId);
        res.status(500).json({ status: false, error: error.message });
    }
};

exports.updateTrip = async (req, res) => {
    const userData = req.user;
    const clientIp = req.clientIp;
    const clientId = userData.memberData.clientId;

    try {
        const updatedFields = {
            ...req.body,
            updatedBy: `${userData.memberData.firstName} ${userData.memberData.lastName}`,
            updatorIp: clientIp,
            clientId
        };

        let trip;

        if (clientId === parseInt(process.env.MASTER_CLIENT_ID)) {
            trip = await TripModel.findOneAndUpdate(
                { _id: req.query.id },
                updatedFields,
                { new: true }
            );
        } else {
            trip = await TripModel.findOneAndUpdate(
                { _id: req.query.id, clientId },
                updatedFields,
                { new: true }
            );
        }

        if (!trip) {
            return res.send({
                data: [],
                message: "No Record Found To Update",
                status: true
            });
        }

        return res.send({
            data: trip,
            message: "Trip updated successfully",
            status: true
        });

    } catch (error) {
        await logException(error.message, 'updateTrip', clientIp, clientId);
        res.status(500).json({ status: false, error: error.message });
    }
};

exports.deleteTrip = async (req, res) => {
    const userData = req.user;
    const clientIp = req.clientIp;
    const clientId = userData.memberData.clientId;
    const masterClientId = parseInt(process.env.MASTER_CLIENT_ID);

    try {
        let ids = req.query.id.split(',').map(id => Number(id.trim()));
        let tripList;

        if (clientId === masterClientId) {
            tripList = await TripModel.find({ _id: { $in: ids } });
        } else {
            tripList = await TripModel.find({ _id: { $in: ids }, clientId });
        }

        if (!tripList.length) {
            return res.send({
                data: [],
                message: "No Records Found To Delete",
                status: true
            });
        }

        await TripModel.deleteMany({ _id: { $in: ids } });

        return res.send({
            count: tripList.length,
            message: "Trip(s) deleted successfully",
            status: true
        });

    } catch (error) {
        await logException(error.message, 'deleteTrip', clientIp, clientId);
        res.status(500).json({ status: false, error: error.message });
    }
};