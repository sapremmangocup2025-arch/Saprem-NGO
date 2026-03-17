const express = require('express');
const router = express.Router();
const { auth, adminOnly } = require('../middleware/auth');
const pdfController = require('../controllers/pdfController');

// Generate village report PDF (Admin only)
router.get('/village-report/:villageId', auth, adminOnly, pdfController.generateVillageReport);

module.exports = router;
