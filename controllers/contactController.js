const ContactModel = require('../models/contactModel');
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

exports.createContact = async (req, res) => {
    const userData = req.user;
    const clientIp = req.clientIp;
    const clientId = userData.memberData.clientId;

    try {
        const savedContact = new ContactModel({
            ...req.body,
            creatorIp: clientIp,
            clientId: clientId,
            createdBy: `${userData.memberData.firstName} ${userData.memberData.lastName}`,
        });

        await savedContact.save();

        return res.send({
            data: savedContact,
            message: "Contact Created Successfully",
            status: true
        });

    } catch (error) {
        await logException(error.message, 'createContact', clientIp, clientId);
        res.status(500).json({ status: false, error: error.message });
    }
};

exports.getContacts = async (req, res) => {
    const userData = req.user;
    const clientIp = req.clientIp;
    const clientId = userData.memberData.clientId;

    try {
        let ContactList;

        if (clientId === parseInt(process.env.MASTER_CLIENT_ID)) {
            ContactList = await ContactModel.find().sort({ _id: -1 });
        } else {
            ContactList = await ContactModel.find({ clientId: clientId }).sort({ _id: -1 });
        }

        if (ContactList.length === 0) {
            return res.send({
                data: [],
                message: "No Contact Record Found",
                status: true
            });
        }

        return res.send({
            data: ContactList,
            message: "Contacts Fetched Successfully",
            status: true
        });

    } catch (error) {
        await logException(error.message, 'getContacts', clientIp, clientId);
        res.status(500).json({ status: false, error: error.message });
    }
};

exports.getContactById = async (req, res) => {
    const userData = req.user;
    const clientIp = req.clientIp;
    const clientId = userData.memberData.clientId;

    try {
        const contact = await ContactModel.findOne({ _id: req.query.id, clientId: clientId });

        if (!contact) {
            return res.send({
                data: [],
                message: "No Record Found",
                status: true
            });
        } else {
            return res.send({
                data: contact,
                message: "Contact Fetched Successfully",
                status: true
            });
        }

    } catch (error) {
        await logException(error.message, 'getContactById', clientIp, clientId);
        res.status(500).json({ status: false, error: error.message });
    }
};

exports.updateContact = async (req, res) => {
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

        let contact;

        if (clientId === parseInt(process.env.MASTER_CLIENT_ID)) {
            contact = await ContactModel.findOneAndUpdate(
                { _id: req.query.id },
                updatedFields,
                { new: true }
            );
        } else {
            contact = await ContactModel.findOneAndUpdate(
                { _id: req.query.id, clientId: clientId },
                updatedFields,
                { new: true }
            );
        }

        if (!contact) {
            return res.send({
                data: [],
                message: "No Record Found To Update",
                status: true
            });
        } else {
            return res.send({
                data: contact,
                message: "Contact Updated Successfully",
                status: true
            });
        }

    } catch (error) {
        await logException(error.message, 'updateContact', clientIp, clientId);
        res.status(500).json({ status: false, error: error.message });
    }
};

exports.deleteContact = async (req, res) => {
    const userData = req.user;
    const clientIp = req.clientIp;
    const clientId = userData.memberData.clientId;
    const masterClientId = parseInt(process.env.MASTER_CLIENT_ID);

    try {
        let ids = req.query.id.split(',').map(id => Number(id.trim()));
        let ContactList;

        if (clientId === masterClientId) {
            ContactList = await ContactModel.find({ _id: { $in: ids } }).sort({ _id: -1 });
        } else {
            ContactList = await ContactModel.find({ _id: { $in: ids }, clientId: clientId }).sort({ _id: -1 });
        }

        if (ContactList.length === 0) {
            return res.send({
                data: [],
                message: "No Records Found To Delete",
                status: true
            });
        }

        const ContactData = ContactList.map(ct => ct.toObject());
        const fileBuffer = await excelFormatter.generateExcelBuffer(ContactData, 'Contacts');

        const attachments = [{
            filename: 'deleted_contacts.xlsx',
            content: fileBuffer,
            encoding: 'base64'
        }];

        const emailText = emailTemplate.DELETE_DATA_MAIL.replace('{{firstName}}', userData.memberData.firstName);

        await mailSender.sendEmailAttachment(
            userData.memberData.emailId,
            "Contact Records Deletion",
            emailText,
            attachments,
            clientIp,
            { isHtml: true }
        );

        const deleted = await ContactModel.deleteMany({ _id: { $in: ids } });

        return res.send({
            count: deleted.deletedCount,
            message: "Contact(s) Deleted Successfully",
            status: true
        });

    } catch (error) {
        await logException(error.message, 'deleteContact', clientIp, clientId);
        res.status(500).json({ status: false, error: error.message });
    }
};

exports.exportContacts = async (req, res) => {
    const userData = req.user;
    const clientIp = req.clientIp;
    const clientId = userData.memberData.clientId;
    const masterClientId = parseInt(process.env.MASTER_CLIENT_ID);

    try {
        let ContactList;

        if (clientId === masterClientId) {
            ContactList = await ContactModel.find().sort({ _id: -1 });
        } else {
            ContactList = await ContactModel.find({ clientId: clientId }).sort({ _id: -1 });
        }

        if (ContactList.length === 0) {
            return res.send({
                data: [],
                message: "No Records Found To Export",
                status: true
            });
        }

        const ContactData = ContactList.map(ct => ct.toObject());
        const fileBuffer = await excelFormatter.generateExcelBuffer(ContactData, 'Contacts');

        const attachments = [{
            filename: 'exported_contacts.xlsx',
            content: fileBuffer,
            encoding: 'base64'
        }];

        const emailText = emailTemplate.EXPORT_DATA_MAIL.replace('{{firstName}}', userData.memberData.firstName);

        await mailSender.sendEmailAttachment(
            userData.memberData.emailId,
            "Exported Contact Records",
            emailText,
            attachments,
            clientIp,
            { isHtml: true }
        );

        return res.send({
            message: "Contacts Data Exported Successfully. Check Your Email.",
            status: true
        });

    } catch (error) {
        await logException(error.message, 'exportContacts', clientIp, clientId);
        res.status(500).json({ status: false, error: error.message });
    }
};