const jwt = require('jsonwebtoken');
const Exception = require('../models/exceptionModel');

const verifyToken = async (req, res, next) => {
    let clientIp;
    try {
        clientIp = getClientIp(req);

        if (!clientIp) {
            const errorMessage = "Your IP Is Not Recognized, Please Send IP";
            await logException(errorMessage, 'verifyToken', clientIp);
            return res.status(400).json({ status: false, error: errorMessage, message: "Your IP Is Not Recognized, Please Send IP" });
        }

        const token = req?.headers["authorization"] ? req?.headers["authorization"].split(' ')[1] : null;

        if (!token) {
            const errorMessage = "Authorization Token Is Required";
            await logException(errorMessage, 'verifyToken', clientIp);
            return res.status(401).json({ status: false, error: errorMessage, message: "An Authorization Token Is Required For Authentication!" });
        }

        try {
            const decoded = jwt.verify(token, process.env.TOKEN_KEY);
            req.user = decoded;
            req.clientIp = clientIp;
            next();
        } catch (err) {
            if (err.name === 'TokenExpiredError') {
                const errorMessage = "Authorization Token Has Expired";
                await logException(errorMessage, 'verifyToken', clientIp);
                return res.status(401).json({ status: false, message: errorMessage, error: err.message });
            } else {
                const errorMessage = "Authorization Token Is Not Valid";
                await logException(errorMessage, 'verifyToken', clientIp);
                return res.status(401).json({ status: false, message: errorMessage, error: err.message });
            }
        }
    } catch (error) {
        await logException(error.message, 'verifyToken', clientIp || 'Unknown IP');
        return res.status(401).json({ status: false, message: "Authorization Token Is Not Valid!", error: error.message });
    }
};

const getClientIp = (req) => {
    return req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket?.remoteAddress;
};

const logException = async (message, methodName, ipAddress) => {
    try {
        const newException = new Exception({
            message: message,
            methodName: methodName,
            ipAddress: ipAddress || 'Unknown IP'
        });
        await newException.save();
    } catch (err) {
        console.log('Error logging exception:', err);
    }
};

module.exports = verifyToken;