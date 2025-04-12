const express = require('express');
const router = express.Router();
const brandController = require('../controllers/brand.controller');

// POST endpoint to submit brand information and start processing
router.post('/brand', brandController.createBrand);

// GET endpoint to retrieve the final or partial results
router.get('/results/:id', brandController.getResults);

module.exports = router; 