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
        default: 5000, // Everyone starts with ₹5000.
    },
    stats: {
        handsPlayed: { 
            type: Number, 
            default: 0 
        },
        potsWon: { 
            type: Number, 
            default: 0 
        },
        biggestPotWon: { 
            type: Number, 
            default: 0 
        }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('User', userSchema);