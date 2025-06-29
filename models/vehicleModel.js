const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);
const formatDate = require('../utils/dateFormattter');

const vehicleSchema = new mongoose.Schema(
    {
        _id: { type: Number },
        clientId: { type: Number },
        userId: { type: Number, required: true, ref: 'userCollection' },
        vehicleName: { type: String },
        vehicleType: { type: String },
        vehicleNumber: { type: String },
        frontImage: { type: String },
        backImage: { type: String },
        createdBy: { type: String },
        updatedBy: { type: String },
        creatorIp: { type: String },
        updatorIp: { type: String },
    },
    { timestamps: true }
);

vehicleSchema.plugin(AutoIncrement, { id: 'vehicle_id_seq', inc_field: '_id' });

vehicleSchema.set('toJSON', {
    transform: function (doc, ret) {
        delete ret.__v;
        ret.createdAt = ret.createdAt ? formatDate(ret.createdAt) : "";
        ret.updatedAt = ret.updatedAt ? formatDate(ret.updatedAt) : "";
        return ret;
    }
});

const Vehicle = mongoose.model('vehicleCollection', vehicleSchema);
module.exports = Vehicle;