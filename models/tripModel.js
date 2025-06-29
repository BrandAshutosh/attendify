const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);
const formatDate = require('../utils/dateFormattter');

const tripSchema = new mongoose.Schema(
    {
        _id: { type: Number },
        clientId: { type: Number },
        userId: { type: Number, required: true, ref: 'userCollection' },
        tripPoints: [
            {
                lat: { type: Number, required: true },
                lng: { type: Number, required: true },
                timestamp: { type: String }
            }
        ],
        startTime: { type: String },
        endTime: { type: String },
        isapplied: { type: Boolean, default: false },
        isapproved: { type: Boolean, default: false },
        isunapproved: { type: Boolean, default: false },
        ispaid: { type: Boolean, default: false },
        createdBy: { type: String },
        updatedBy: { type: String },
        creatorIp: { type: String },
        updatorIp: { type: String }
    },
    { timestamps: true }
);

tripSchema.plugin(AutoIncrement, { id: 'trip_id_seq', inc_field: '_id' });

tripSchema.set('toJSON', {
    transform: function (doc, ret) {
        delete ret.__v;
        ret.createdAt = ret.createdAt ? formatDate(ret.createdAt) : "";
        ret.updatedAt = ret.updatedAt ? formatDate(ret.updatedAt) : "";
        return ret;
    }
});

module.exports = mongoose.model('tripCollection', tripSchema);