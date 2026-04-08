// routes/invoices.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/invoicesController');

// IMPORTANT: /next-number/:type must come BEFORE /:id to avoid param collision
router.get('/next-number/:type', ctrl.getNextNumber);

router.get('/',        ctrl.list);
router.post('/',       ctrl.add);
router.delete('/:id',  ctrl.remove);

module.exports = router;
