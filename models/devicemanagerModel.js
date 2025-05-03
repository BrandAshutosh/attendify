const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);
const formatDate = require('../utils/dateFormattter');

const devicemanagerSchema = new mongoose.Schema(
    {
        _id: { type: Number },
        clientId: { type: Number },
        deviceName: { type: String },
        date: { type: String },
        deviceInfo: { type: String },
        createdBy: { type: String },
        updatedBy: { type: String },
        creatorIp: { type: String },
        updatorIp: { type: String },
    },
    { timestamps: true }
);

devicemanagerSchema.plugin(AutoIncrement, { id: 'device_id_seq', inc_field: '_id' });

devicemanagerSchema.set('toJSON', {
    transform: function (doc, ret) {
        delete ret.__v;
        ret.createdAt = ret.createdAt ? formatDate(ret.createdAt) : "";
        ret.updatedAt = ret.updatedAt ? formatDate(ret.updatedAt) : "";
        return ret;
    }
});

const DeviceManager = mongoose.model('devicemanagerCollection', devicemanagerSchema);
module.exports = DeviceManager;
