// routes/payments.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/paymentsController');

router.get('/',   ctrl.list);
router.post('/',  ctrl.add);

module.exports = router;
