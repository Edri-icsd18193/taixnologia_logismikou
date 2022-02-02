const express = require('express')
const router = express.Router()
const DVD = require('../models/dvd')
const Stock = require('../models/stock')
const imageMimeTypes = ['image/jpeg', 'image/png', 'images/gif']

// All Stores Route
router.get('/', async (req, res) => {
    let query = Stock.find()
    if (req.query.title != null && req.query.title != '') {
        query = query.regex('title', new RegExp(req.query.title, 'i'))
    }
    try {
        const stocks = await query.exec()
        res.render('stores/index', {
            stocks: stocks,
            searchOptions: req.query,
            role: req.user
        })
    } catch {
        res.redirect('/')
    }
})

// New Store Route
router.get('/new', async (req, res) => {
    renderNewPage(req, res, new Stock())
})

// Create Store Route
router.post('/', async (req, res) => {
    const stock = new Stock({
        inStock: req.body.inStock,
        price: req.body.price,
        dvd: req.body.dvd
    })
    try {
        const newStock = await stock.save()
        res.redirect(`stores/${newStock.id}`)
    } catch {
        renderNewPage(req, res, stock, true)
    }
})

// Show DVD Route
router.get('/:id', async (req, res) => {
    try {
        const stock = await Stock.findById(req.params.id).exec()
        res.render('stores/show', {
            stock: stock,
            role: req.user
        })
    } catch {
        res.redirect('/')
    }
})

// Edit DVD Route
router.get('/:id/edit', async (req, res) => {
    try {
        const stock = await Stock.findById(req.params.id).exec()
        renderEditPage(req, res, stock)
    } catch {
        res.redirect('/')
    }
})

// Update DVD Route
router.put('/:id', async (req, res) => {
    let stock

    try {
        stock = await Stock.findById(req.params.id)
        stock.inStock = req.body.inStock
        stock.price = req.body.price
        stock.dvd = req.body.dvd

        await stock.save()
        res.redirect(`/stores/${stock.id}`)
    } catch {
        if (stock != null) {
            renderEditPage(req, res, stock, true)
        } else {
            redirect('/')
        }
    }
})

// Delete DVD Page
router.delete('/:id', async (req, res) => {
    let stock
    try {
        stock = await Stock.findById(req.params.id)
        await stock.remove()
        res.redirect('/stores')
    } catch {
        if (stock != null) {
            res.render('stores/show', {
                stock: stock,
                errorMessage: 'Could not remove Stock'
            })
        } else {
            res.redirect('/')
        }
    }
})

async function renderNewPage(req, res, stock, hasError = false) {
    renderFormPage(req, res, stock, 'new', hasError)
}

async function renderEditPage(req, res, stock, hasError = false) {
    renderFormPage(req, res, stock, 'edit', hasError)
}

async function renderFormPage(req, res, stock, form, hasError = false) {
    try {
        const params = {
            stock: stock,
            role: req.user
        }
        if (hasError) {
            if (form === 'edit') {
                params.errorMessage = 'Error Updating Stock'
            } else {
                params.errorMessage = 'Error Creating Stock'
            }
        }
        res.render(`stores/${form}`, params)
    } catch {
        res.redirect('/stores')
    }
}

module.exports = router