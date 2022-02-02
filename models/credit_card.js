const mongoose = require('mongoose')

const credit_cardSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    amount: {
        type: Number,
        required: true
    },
    createdAt: {
        type: Date,
        required: true,
        default: Date.now
    },
    activated: {
        type: Boolean,
        default: false
    },
    pelatis: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Pelatis'
    }
})

module.exports = mongoose.model('CreditCard', credit_cardSchema)