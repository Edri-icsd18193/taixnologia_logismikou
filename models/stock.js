const mongoose = require('mongoose')

const stockSchema = new mongoose.Schema({
    inStock: {
        type: Number,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    dvd: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'DVD'
    }
})

module.exports = mongoose.model('Stock', bookSchema)