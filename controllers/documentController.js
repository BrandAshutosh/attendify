const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '..', 'uploads', 'documents');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

exports.documentUpload = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                status: false,
                message: "No file uploaded"
            });
        }

        const domain = req.protocol + '://' + req.get('host');
        const relativePath = `/uploads/documents/${req.file.filename}`;
        const fullPath = domain + relativePath;

        return res.send({
            status: true,
            message: "Document uploaded successfully",
            data: {
                filename: req.file.filename,
                originalname: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size,
                path: relativePath,
                fullPath: fullPath 
            }
        });
    } catch (error) {
        res.status(500).json({
            status: false,
            error: error.message
        });
    }
};