const express = require('express')
const router = express.Router()
const Book = require('../models/book')
const DVD = require('../models/dvd')

router.get('/', async (req, res) => {
  let query = DVD.find()
  if (req.query.title != null && req.query.title != '') {
    query = query.regex('title', new RegExp(req.query.title, 'i'))
  }
  try {
    const dvds = await query.exec()
    res.render('index', {
      dvds: dvds,
      role: req.session.role
    })
  } catch {
    res.redirect('/')
  }
})

module.exports = router