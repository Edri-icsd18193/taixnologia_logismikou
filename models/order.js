const mongoose = require('mongoose')

const orderSchema = new mongoose.Schema({
    address: {
        type: String,
        required: true,
        default: "None"
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
    arrived: {
        type: Date,
        default: undefined
    },
    state: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        default: "Created"
    },
    pelatis: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Pelatis'
    },
    dvd: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'DVD'
    },
    credit_card: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CreditCard'
    }

})

module.exports = mongoose.model('Order', orderSchema)