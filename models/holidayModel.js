const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);
const formatDate = require('../utils/dateFormattter');

const holidaySchema = new mongoose.Schema(
    {
        _id: { type: Number },
        clientId: { type: Number },
        year: { type: String },
        date: { type: String },
        numberOfDays: { type: Number },
        createdBy: { type: String },
        updatedBy: { type: String },
        creatorIp: { type: String },
        updatorIp: { type: String },
    },
    { timestamps: true }
);

holidaySchema.plugin(AutoIncrement, { id: 'holiday_id_seq', inc_field: '_id' });

holidaySchema.set('toJSON', {
    transform: function (doc, ret) {
        delete ret.__v;
        ret.createdAt = ret.createdAt ? formatDate(ret.createdAt) : "";
        ret.updatedAt = ret.updatedAt ? formatDate(ret.updatedAt) : "";
        return ret;
    }
});

const Holiday = mongoose.model('holidayCollection', holidaySchema);
module.exports = Holiday;
