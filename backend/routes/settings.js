// routes/settings.js
const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');

// Reset DB
router.post('/reset-system', settingsController.resetSystem);

// Backup DB
router.post('/backup', settingsController.backupDatabase);

// Export CSV
router.get('/export/customers', settingsController.exportCustomersCSV);
router.get('/export/suppliers', settingsController.exportSuppliersCSV);

module.exports = router;
