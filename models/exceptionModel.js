const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const exceptionSchema = new mongoose.Schema(
    {
        _id: { type: Number},
        clientId: { type: Number},
        message: { type: String},
        methodName: { type: String},
        ipAddress: { type: String},
    },
    { timestamps: true }
);

exceptionSchema.plugin(AutoIncrement, { id: 'exception_id_seq', inc_field: '_id' });

exceptionSchema.set('toJSON', {
    transform: function (doc, ret) {
        delete ret.__v;
        return ret;
    }
});

const Exception = mongoose.model('exceptionCollection', exceptionSchema);
module.exports = Exception;