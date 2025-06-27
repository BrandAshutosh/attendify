const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);
const formatDate = require('../utils/dateFormattter');

const contactSchema = new mongoose.Schema(
    {
        _id: { type: Number },
        clientId: { type: Number },
        userId: { type: Number, required: true, ref: 'userCollection' },
        name: { type: String },
        email: { type: String },
        message: { type: String },
        createdBy: { type: String },
        updatedBy: { type: String },
        creatorIp: { type: String },
        updatorIp: { type: String },
    },
    { timestamps: true }
);

contactSchema.plugin(AutoIncrement, { id: 'contact_id_seq', inc_field: '_id' });

contactSchema.set('toJSON', {
    transform: function (doc, ret) {
        delete ret.__v;
        ret.createdAt = ret.createdAt ? formatDate(ret.createdAt) : "";
        ret.updatedAt = ret.updatedAt ? formatDate(ret.updatedAt) : "";
        return ret;
    }
});

const Contact = mongoose.model('contactCollection', contactSchema);
module.exports = Contact;