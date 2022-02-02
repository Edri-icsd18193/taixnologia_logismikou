const express = require('express')
const router = express.Router()
const DVD = require('../models/dvd')
const imageMimeTypes = ['image/jpeg', 'image/png', 'images/gif']

// All DVDs Route
router.get('/', async (req, res) => {
    let query = DVD.find()
    if (req.query.title != null && req.query.title != '') {
        query = query.regex('title', new RegExp(req.query.title, 'i'))
    }
    try {
        const dvds = await query.sort({ title: 'desc' }).exec()
        res.render('dvds/index', {
            dvds: dvds,
            searchOptions: req.query,
            role: req.session.role
        })
    } catch {
        res.redirect('/')
    }
})

// New DVD Route
router.get('/new', async (req, res) => {
    if(req.session.role!="Admin"){
        res.redirect('/');
        return;
    }
    renderNewPage(req, res, new DVD())
})

// Create DVD Route
router.post('/', async (req, res) => {
    if(req.session.role!="Admin"){
        res.redirect('/');
        return;
    }
    const dvd = new DVD({
        title: req.body.title,
        actors: req.body.actors,
        director: req.body.director,
        publishDate: new Date(req.body.publishDate),
        duration: req.body.duration,
        category: req.body.category,
        dubs: req.body.dubs,
        subtitles: req.body.subtitles,
        inStock: req.body.inStock,
        price: req.body.price
    })
    saveCover(dvd, req.body.cover)

    try {
        const newDVD = await dvd.save()
        res.redirect(`dvds/${newDVD.id}`)
    } catch {
        renderNewPage(req, res, dvd, true)
    }
})

// Show DVD Route
router.get('/:id', async (req, res) => {
    try {
        const dvd = await DVD.findById(req.params.id).exec()
        res.render('dvds/show', {
            dvd: dvd,
            role: req.session.role
        })
    } catch {
        res.redirect('/')
    }
})

// Edit DVD Route
router.get('/:id/edit', async (req, res) => {
    try {
        if(req.session.role!="Admin"){
            res.redirect('/');
            return;
        }
        console.log("test edit");
        const dvd = await DVD.findById(req.params.id).exec()
        renderEditPage(req, res, dvd)
    } catch {
        res.redirect('/')
    }
})

// Update DVD Route
router.put('/:id', async (req, res) => {
    let dvd

    try {
        if(req.session.role!="Admin"){
            res.redirect('/');
            return;
        }
        dvd = await DVD.findById(req.params.id)
        dvd.title = req.body.title
        dvd.actors = req.body.actors
        dvd.director = req.body.director
        dvd.publishDate = new Date(req.body.publishDate)
        dvd.duration = req.body.duration
        dvd.category = req.body.category
        dvd.dubs = req.body.dubs
        dvd.subtitles = req.body.subtitles
        dvd.inStock = req.body.inStock
        dvd.price = req.body.price
        if (req.body.cover != null && req.body.cover !== '') {
            saveCover(dvd, req.body.cover)
        }
        await dvd.save()
        res.redirect(`/dvds/${dvd.id}`)
    } catch {
        if (dvd != null) {
            renderEditPage(req, res, dvd, true)
        } else {
            redirect('/')
        }
    }
})

// Delete DVD Page
router.delete('/:id', async (req, res) => {
    let dvd
    try {
        dvd = await DVD.findById(req.params.id)
        await dvd.remove()
        res.redirect('/dvds')
    } catch {
        if (dvd != null) {
            res.render('dvds/show', {
                dvd: dvd,
                errorMessage: 'Could not remove dvd'
            })
        } else {
            res.redirect('/')
        }
    }
})

async function renderNewPage(req, res, dvd, hasError = false) {
    renderFormPage(req, res, dvd, 'new', hasError)
}

async function renderEditPage(req, res, dvd, hasError = false) {
    console.log("RemderEditPage");
    renderFormPage(req, res, dvd, 'edit', hasError)
}

async function renderFormPage(req, res, dvd, form, hasError = false) {
    try {
        const params = {
            dvd: dvd,
            role: req.session.role
        }
        if (hasError) {
            if (form === 'edit') {
                params.errorMessage = 'Error Updating DVD'
            } else {
                params.errorMessage = 'Error Creating DVD'
            }
        }
        console.log("Seee");
        res.render(`dvds/${form}`, params)
    } catch {
        res.redirect('/dvds')
    }
}

function saveCover(dvd, coverEncoded) {
    if (coverEncoded == null) return
    const cover = JSON.parse(coverEncoded)
    if (cover != null && imageMimeTypes.includes(cover.type)) {
        dvd.coverImage = new Buffer.from(cover.data, 'base64')
        dvd.coverImageType = cover.type
    }
}

module.exports = router