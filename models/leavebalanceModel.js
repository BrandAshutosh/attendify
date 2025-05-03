const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);
const formatDate = require('../utils/dateFormattter');

const leavebalanceSchema = new mongoose.Schema(
    {
        _id: { type: Number },
        clientId: { type: Number },
        userId: { type: Number, required: true, ref: 'userCollection' },
        earnedLeave: { type: Number },
        sickLeave: { type: Number },
        casualLeave: { type: Number },
        createdBy: { type: String },
        updatedBy: { type: String },
        creatorIp: { type: String },
        updatorIp: { type: String },
    },
    { timestamps: true }
);

leavebalanceSchema.plugin(AutoIncrement, { id: 'leavebal_id_seq', inc_field: '_id' });

leavebalanceSchema.set('toJSON', {
    transform: function (doc, ret) {
        delete ret.__v;
        ret.createdAt = ret.createdAt ? formatDate(ret.createdAt) : "";
        ret.updatedAt = ret.updatedAt ? formatDate(ret.updatedAt) : "";
        return ret;
    }
});

const LeaveBalance = mongoose.model('leavebalanceCollection', leavebalanceSchema);
module.exports = LeaveBalance;
