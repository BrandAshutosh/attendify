const Exception = require('../models/exceptionModel');

exports.createException = async (req, res) => {
    try {
        const savedException = new Exception(req.body);
        await savedException.save();
        return res.send({
            data: savedException,
            message: "Exception Created Successfully",
            status: true
        });
    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
};

exports.getExceptions = async (req, res) => {
    try {
        const exceptions = await Exception.find();
        return res.send({
            data: exceptions,
            message: "Exceptions Fetched Successfully",
            status: true
        });
    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
};

exports.getExceptionById = async (req, res) => {
    try {
        const exception = await Exception.findById(req.query.id);
        if (!exception) {
            return res.send({
                data: exception,
                message: "No Record Found",
                status: true
            });
        } else {
            return res.send({
                data: exception,
                message: "Exception Fetched Successfully",
                status: true
            });
        }
    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
};

exports.updateException = async (req, res) => {
    try {
        const updateexception = await Exception.findByIdAndUpdate(req.query.id, req.body, { new: true });
        if (!updateexception) {
            return res.send({
                message: "No Record Found",
                status: true
            });
        }
        else {
            return res.send({
                data: updateexception,
                message: "Exception Updated Successfully",
                status: true
            });
        }
    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
};

exports.deleteException = async (req, res) => {
    try {
        const deleteexception = await Exception.findByIdAndDelete(req.query.id);
        if (!deleteexception) {
            return res.send({
                message: "No Record Found",
                status: true
            });
        } else {
            return res.send({
                data: deleteexception,
                message: "Exception Deleted Successfully",
                status: true
            });
        }
    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
};
