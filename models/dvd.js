const mongoose = require('mongoose')

const dvdSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    actors: {
        type: String,
        required: true
    },
    director: {
        type: String,
        required: true
    },
    publishDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    coverImage: {
        type: Buffer,
        required: true
    },
    coverImageType: {
        type: String,
        required: true
    },
    dubs: {
        type: String,
        required: true
    },
    subtitles: {
        type: String,
        required: true
    },
    duration: {
        type: Number,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    inStock: {
        type: Number,
        required: true,
        default: 0
    },
    price: {
        type: Number,
        required: true,
        default: 0
    }
})

dvdSchema.virtual('coverImagePath').get(function () {
    if (this.coverImage != null && this.coverImageType != null) {
        return `data:${this.coverImageType};charset=utf-8;base64,${this.coverImage.toString('base64')}`
    }
})

module.exports = mongoose.model('DVD', dvdSchema)