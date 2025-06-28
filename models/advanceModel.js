const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);
const formatDate = require('../utils/dateFormattter');

const advanceSchema = new mongoose.Schema(
    {
        _id: { type: Number },
        clientId: { type: Number },
        userId: { type: Number, required: true, ref: 'userCollection' },
        amount: { type: Number },
        forDate: { type: String},  
        remarks: { type: String },
        isapplied: { type: Boolean, default: false },
        isapproved: { type: Boolean, default: false },
        isunapproved: { type: Boolean, default: false },
        ispaid: { type: Boolean, default: false },
        createdBy: { type: String },
        updatedBy: { type: String },
        creatorIp: { type: String },
        updatorIp: { type: String },
    },
    { timestamps: true }
);

advanceSchema.plugin(AutoIncrement, { id: 'advance_id_seq', inc_field: '_id' });

advanceSchema.set('toJSON', {
    transform: function (doc, ret) {
        delete ret.__v;
        ret.createdAt = ret.createdAt ? formatDate(ret.createdAt) : "";
        ret.updatedAt = ret.updatedAt ? formatDate(ret.updatedAt) : "";
        return ret;
    }
});

const Advance = mongoose.model('advanceCollection', advanceSchema);
module.exports = Advance;