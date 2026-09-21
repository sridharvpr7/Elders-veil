const express = require('express');
const router = express.Router();
const comicsController = require('../controllers/comics.controller');

router.get('/', comicsController.getComics);
router.get('/:id', comicsController.getComicById);

module.exports = router;
