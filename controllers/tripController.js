const TripModel = require('../models/tripModel');
const Exception = require('../models/exceptionModel');

const logException = async (message, methodName, ipAddress, clientId) => {
    try {
        const newException = new Exception({ message, methodName, ipAddress, clientId });
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
            return res.status(400).json({ status: false, message: "Trip path data is required" });
        }

        const newTrip = new TripModel({
            userId,
            clientId,
            tripPoints,
            startTime,
            endTime,
            isapplied,
            createdBy: `${userData.memberData.firstName} ${userData.memberData.lastName}`,
            creatorIp: clientIp
        });

        await newTrip.save();

        return res.send({
            data: newTrip,
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

    const haversineDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371e3; 
        const toRad = deg => (deg * Math.PI) / 180;

        const φ1 = toRad(lat1);
        const φ2 = toRad(lat2);
        const Δφ = toRad(lat2 - lat1);
        const Δλ = toRad(lon2 - lon1);

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    };

    try {
        let tripList;

        if (clientId === parseInt(process.env.MASTER_CLIENT_ID)) {
            tripList = await TripModel.find()
                .sort({ _id: -1 })
                .populate('userId', 'firstName lastName emailId mobile imageUrl');
        } else {
            tripList = await TripModel.find({ clientId })
                .sort({ _id: -1 })
                .populate('userId', 'firstName lastName emailId mobile imageUrl');
        }

        const processedTrips = tripList.map(trip => {
            const points = trip.tripPoints || [];
            let totalDistance = 0;

            for (let i = 1; i < points.length; i++) {
                const prev = points[i - 1];
                const curr = points[i];
                totalDistance += haversineDistance(prev.lat, prev.lng, curr.lat, curr.lng);
            }

            return {
                ...trip.toObject(),
                totalDistanceInMeters: Math.round(totalDistance),
                totalDistanceInKilometers: (totalDistance / 1000).toFixed(2)
            };
        });

        return res.send({
            data: processedTrips,
            message: processedTrips.length ? "Trips fetched successfully" : "No Trip Record Found",
            status: true
        });

    } catch (error) {
        await logException(error.message, 'getTrips', clientIp, clientId);
        res.status(500).json({ status: false, error: error.message });
    }
};

exports.getClaimedTrips = async (req, res) => {
    const userData = req.user;
    const clientIp = req.clientIp;
    const clientId = userData.memberData.clientId;

    const haversineDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371e3;
        const toRad = deg => (deg * Math.PI) / 180;

        const φ1 = toRad(lat1);
        const φ2 = toRad(lat2);
        const Δφ = toRad(lat2 - lat1);
        const Δλ = toRad(lon2 - lon1);

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    };

    try {
        let tripList;

        const baseQuery = { isapplied: true };

        if (clientId === parseInt(process.env.MASTER_CLIENT_ID)) {
            tripList = await TripModel.find(baseQuery)
                .sort({ _id: -1 })
                .populate('userId', 'firstName lastName emailId mobile imageUrl');
        } else {
            tripList = await TripModel.find({ ...baseQuery, clientId })
                .sort({ _id: -1 })
                .populate('userId', 'firstName lastName emailId mobile imageUrl');
        }

        const processedTrips = tripList.map(trip => {
            const points = trip.tripPoints || [];
            let totalDistance = 0;

            for (let i = 1; i < points.length; i++) {
                const prev = points[i - 1];
                const curr = points[i];
                totalDistance += haversineDistance(prev.lat, prev.lng, curr.lat, curr.lng);
            }

            return {
                ...trip.toObject(),
                totalDistanceInMeters: Math.round(totalDistance),
                totalDistanceInKilometers: (totalDistance / 1000).toFixed(2)
            };
        });

        return res.send({
            data: processedTrips,
            message: processedTrips.length ? "Trips fetched successfully" : "No Trip Record Found",
            status: true
        });

    } catch (error) {
        await logException(error.message, 'getClaimedTrips', clientIp, clientId);
        res.status(500).json({ status: false, error: error.message });
    }
};

exports.getTripReports = async (req, res) => {
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

        const approvedCount = await TripModel.countDocuments({ ...filter, isapproved: 1 });
        const unapprovedCount = await TripModel.countDocuments({ ...filter, isunapproved: 1 });
        const appliedCount = await TripModel.countDocuments({ ...filter, isapplied: 1 });
        const paidCount = await TripModel.countDocuments({ ...filter, ispaid: 1 });

        const report = [
            { approved: approvedCount },
            { unapproved: unapprovedCount },
            { applied: appliedCount },
            { paid: paidCount }
        ];

        return res.send({
            data: report,
            message: "Trip Report Fetched Successfully",
            status: true
        });

    } catch (error) {
        await logException(error.message, 'getTripReports', clientIp, clientId);
        res.status(500).json({ status: false, error: error.message });
    }
};

exports.getTripById = async (req, res) => {
    const userData = req.user;
    const clientIp = req.clientIp;
    const clientId = userData.memberData.clientId;

    try {
        const trip = await TripModel.findOne({ _id: req.query.id, clientId });

        if (!trip) {
            return res.send({ data: [], message: "No Record Found", status: true });
        }

        return res.send({ data: trip, message: "Trip fetched successfully", status: true });

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
            trip = await TripModel.findOneAndUpdate({ _id: req.query.id }, updatedFields, { new: true });
        } else {
            trip = await TripModel.findOneAndUpdate({ _id: req.query.id, clientId }, updatedFields, { new: true });
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
        const ids = req.query.id.split(',').map(id => Number(id.trim()));
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

exports.acceptTrip = async (req, res) => {
    const userData = req.user;
    const clientIp = req.clientIp;
    const clientId = userData.memberData.clientId;

    try {
        const updateFields = {
            isapplied: false,
            isapproved: true,
            isunapproved: false,
            ispaid: false,
            updatedBy: `${userData.memberData.firstName} ${userData.memberData.lastName}`,
            updatorIp: clientIp,
            clientId
        };

        const filter = clientId === parseInt(process.env.MASTER_CLIENT_ID)
            ? { _id: req.query.id }
            : { _id: req.query.id, clientId };

        const trip = await TripModel.findOneAndUpdate(filter, updateFields, { new: true });

        if (!trip) {
            return res.send({
                data: [],
                message: "No Record Found To Approve",
                status: true
            });
        }

        return res.send({
            data: trip,
            message: "Trip approved successfully",
            status: true
        });

    } catch (error) {
        await logException(error.message, 'acceptTrip', clientIp, clientId);
        res.status(500).json({ status: false, error: error.message });
    }
};

exports.rejectTrip = async (req, res) => {
    const userData = req.user;
    const clientIp = req.clientIp;
    const clientId = userData.memberData.clientId;

    try {
        const updateFields = {
            isapplied: false,
            isapproved: false,
            isunapproved: true,
            ispaid: false,
            updatedBy: `${userData.memberData.firstName} ${userData.memberData.lastName}`,
            updatorIp: clientIp,
            clientId
        };

        const filter = clientId === parseInt(process.env.MASTER_CLIENT_ID)
            ? { _id: req.query.id }
            : { _id: req.query.id, clientId };

        const trip = await TripModel.findOneAndUpdate(filter, updateFields, { new: true });

        if (!trip) {
            return res.send({
                data: [],
                message: "No Record Found To Reject",
                status: true
            });
        }

        return res.send({
            data: trip,
            message: "Trip rejected successfully",
            status: true
        });

    } catch (error) {
        await logException(error.message, 'rejectTrip', clientIp, clientId);
        res.status(500).json({ status: false, error: error.message });
    }
};                