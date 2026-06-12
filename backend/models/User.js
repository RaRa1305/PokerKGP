const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    chips: {
        type: Number,
        default: 5000, // Everyone starts with a ₹5000.
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('User', userSchema);