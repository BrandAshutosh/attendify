const { uploadFileToDrive } = require('../utils/uploadDocument');

exports.documentUpload = async (req, res) => {
    try {

        const driveUrl = await uploadFileToDrive(req.file.path, req.file.originalname);

        res.send({
            status: true,
            message: "Uploaded Successfully",
            data: {
                originalname: req.file.originalname,
                size: req.file.size,
                url: driveUrl
            }
        });
    } catch (error) {
        res.status(500).json({ status: false, message: "Failed To Upload", error: error.message });
    }
};