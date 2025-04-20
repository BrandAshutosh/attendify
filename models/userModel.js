const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);
const formatDate = require('../utils/dateFormattter');

const userSchema = new mongoose.Schema(
    {
        _id: { type: Number },
        clientId: { type: Number },
        type: { type: Number },
        package: { type: Number },
        firstName: { type: String },
        middleName: { type: String },
        lastName: { type: String },
        dob: { type: String },
        emailId: { type: String },
        mobile: { type: String },
        country: { type: String },
        state: { type: String },
        district: { type: String },
        city: { type: String },
        landmark: { type: String },
        pincode: { type: Number },
        address: { type: String },
        aadharnumber: { type: String },
        pannumber: { type: String },
        password: { type: String },
        permission: { type: Object },
        imageUrl: { type: String },
        fcmToken: { type: String },
        isActive: { type: Number },
        createdBy: { type: String },
        updatedBy: { type: String },
        creatorIp: { type: String },
        updatorIp: { type: String },
    },
    { timestamps: true }
);

userSchema.plugin(AutoIncrement, { id: 'user_id_seq', inc_field: '_id' });

userSchema.set('toJSON', {
    transform: function (doc, ret) {
        delete ret.__v;
        ret.createdAt = ret.createdAt ? formatDate(ret.createdAt) : "";
        ret.updatedAt = ret.updatedAt ? formatDate(ret.updatedAt) : "";
        return ret;
    }
});

const User = mongoose.model('userCollection', userSchema);
module.exports = User;