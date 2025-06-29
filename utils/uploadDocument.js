const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mime = require('mime-types');
const readline = require('readline');
const { google } = require('googleapis');

const uploadDir = path.join(__dirname, '..', 'uploads', 'documents');
const CREDENTIALS_PATH = path.join(__dirname, '../public/assets/credentials.json');
const TOKEN_PATH = path.join(__dirname, '../public/assets/token.json');
const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e5);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

async function authorize() {
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    if (fs.existsSync(TOKEN_PATH)) {
        const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
        oAuth2Client.setCredentials(token);
        return oAuth2Client;
    }

    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });

    console.log('Authorize This App By Visiting The URL:\n' + authUrl);
    const open = (await import('open')).default;
    await open(authUrl);

    return new Promise((resolve, reject) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        rl.question('Enter The Code From That Page Here: ', (code) => {
            rl.close();
            oAuth2Client.getToken(code, (err, token) => {
                if (err) return reject('Error Retrieving Access Token');
                fs.writeFileSync(TOKEN_PATH, JSON.stringify(token));
                oAuth2Client.setCredentials(token);
                resolve(oAuth2Client);
            });
        });
    });
}

async function uploadFileToDrive(localFilePath, fileName) {
    try {
        const auth = await authorize();
        const drive = google.drive({ version: 'v3', auth });

        const fileMetadata = { name: fileName };
        const media = {
            mimeType: mime.lookup(localFilePath),
            body: fs.createReadStream(localFilePath),
        };

        const response = await drive.files.create({
            requestBody: fileMetadata,
            media,
            fields: 'id',
        });

        const fileId = response.data.id;

        await drive.permissions.create({
            fileId,
            requestBody: {
                role: 'reader',
                type: 'anyone',
            },
        });

        const publicUrl = `https://drive.google.com/uc?id=${fileId}`;
        fs.unlinkSync(localFilePath);
        return publicUrl;
    } catch (error) {
        console.error("Upload Failed:", error.message);
        throw new Error("Failed To Upload File To Google Drive");
    }
}

module.exports = {
    upload,
    uploadFileToDrive
};