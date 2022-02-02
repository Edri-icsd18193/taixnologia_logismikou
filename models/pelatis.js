const mongoose = require('mongoose')

const pelatisSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    surname: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },

})

module.exports = mongoose.model('Pelatis', pelatisSchema)