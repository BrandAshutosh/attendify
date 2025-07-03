const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);
const formatDate = require('../utils/dateFormattter');

const shiftSchema = new mongoose.Schema(
    {
        _id: { type: Number },
        clientId: { type: Number },
        shift: { type: String },
        startTime: { type: String },
        endTime: { type: String },
        createdBy: { type: String },
        updatedBy: { type: String },
        creatorIp: { type: String },
        updatorIp: { type: String },
    },
    { timestamps: true }
);

shiftSchema.plugin(AutoIncrement, { id: 'shift_id_seq', inc_field: '_id' });

shiftSchema.set('toJSON', {
    transform: function (doc, ret) {
        delete ret.__v;
        ret.createdAt = ret.createdAt ? formatDate(ret.createdAt) : "";
        ret.updatedAt = ret.updatedAt ? formatDate(ret.updatedAt) : "";
        return ret;
    }
});

const Shift = mongoose.model('shiftCollection', shiftSchema);
module.exports = Shift;