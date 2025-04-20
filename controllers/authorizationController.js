const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mailSender = require('../utils/mailSender');
const emailTemplate = require('../templates/emailTemplates');


exports.signup = async (req, res) => {
    try {
        const { emailId, password, mobile, firstName, lastName, ...rest } = req.body;

        const existingUser = await User.findOne({ emailId });
        if (existingUser) {
            return res.status(400).json({ status: false, message: 'User Already Exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = new User({
            ...rest,
            emailId,
            firstName,
            lastName,
            password: hashedPassword,
            createdBy: `${firstName} ${lastName}`,
            updatedBy: `${firstName} ${lastName}`,
            creatorIp: req.ip,
            updatorIp: req.ip,
            isActive: 1
        });

        await user.save();

        const token = jwt.sign(
            { memberData: user.toJSON() },
            process.env.TOKEN_KEY,
            { expiresIn: '2d' }
        );

        const subject = 'Welcome To Attendify';

        const content = emailTemplate.SIGNUP_MAIL
            .replace('{{firstName}}', firstName || '')
            .replace('{{lastName}}', lastName || '')
            .replace('{{email}}', emailId || '')
            .replace('{{mobile}}', mobile || '')
            .replace('{{password}}', password || '');

        await mailSender.sendEmail(emailId, subject, content, req.ip, { isHtml: false });

        return res.status(201).json({
            status: true,
            message: 'User Signed Up Successfully',
            data: {
                user,
                token
            }
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            error: error.message
        });
    }
};

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                status: false,
                message: 'Username And Password Are Required'
            });
        }

        const user = await User.findOne({
            $or: [
                { emailId: username },
                { mobile: username }
            ]
        });

        if (!user) {
            return res.status(404).json({ status: false, message: 'User Not Found' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ status: false, message: 'Invalid Credentials' });
        }

        const token = jwt.sign({ memberData: user.toJSON() }, process.env.TOKEN_KEY, { expiresIn: '2d' });

        return res.status(200).json({
            status: true,
            message: 'Login Successful',
            data: { user, token }
        });
    } catch (error) {
        return res.status(500).json({ status: false, error: error.message });
    }
};

exports.forgetPassword = async (req, res) => {
    try {
        const { username } = req.body;

        if (!username) {
            return res.status(400).json({
                status: false,
                message: 'Username (Email Or Mobile) Is required'
            });
        }

        const user = await User.findOne({
            $or: [
                { emailId: username },
                { mobile: username }
            ]
        });

        if (!user) {
            return res.status(404).json({ status: false, message: 'User Not Found' });
        }

        const tempPassword = Math.floor(10000000 + Math.random() * 90000000);

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(tempPassword.toString(), salt); 

        user.password = hashedPassword;
        await user.save();

        const subject = 'Your Password Retrieval';
        const content = emailTemplate.FORGETPASSWORD_MAIL
            .replace('{{firstName}}', user.firstName || '')
            .replace('{{newPassword}}', tempPassword.toString()); 

        await mailSender.sendEmail(user.emailId, subject, content, req.ip, { isHtml: false });
        return res.status(200).json({
            status: true,
            message: 'A Temporary Password Has Been Sent To Your Email Or Mobile'
        });
    } catch (error) {
        return res.status(500).json({ status: false, error: error.message });
    }
};