const nodemailer = require('nodemailer');
const Exception = require('../models/exceptionModel');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

const sendEmail = async (to, subject, content, ipAddress, options = {}) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: to,
            subject: subject,
            ...(options.isHtml ? { html: content } : { text: content })
        };

        const info = await transporter.sendMail(mailOptions);
        return { status: true, response: info.response };
    } catch (error) {
        await logException(error.message, 'sendEmail', ipAddress);
        return { status: false, error: error.message };
    }
};

const sendEmailAttachment = async (to, subject, content, attachments, ipAddress, options = {}) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: to,
            subject: subject,
            ...(options.isHtml ? { html: content } : { text: content }),
            attachments: attachments
        };

        const info = await transporter.sendMail(mailOptions);
        return { status: true, response: info.response };
    } catch (error) {
        await logException(error.message, 'sendEmailAttachment', ipAddress);
        return { status: false, error: error.message };
    }
};

const logException = async (message, methodName, ipAddress) => {
    try {
        const newException = new Exception({
            message: message,
            methodName: methodName,
            ipAddress: ipAddress
        });
        await newException.save();
    } catch (err) {
        console.log('Error logging exception:', err);
    }
};

module.exports = { sendEmail, sendEmailAttachment };