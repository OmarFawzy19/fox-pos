// routes/wallet.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/walletController');

// IMPORTANT: named sub-routes must come before param-based routes
router.get('/expenses',    ctrl.listExpenses);
router.post('/expenses',   ctrl.addExpense);
router.patch('/add',       ctrl.add);
router.patch('/deduct',    ctrl.deduct);
router.get('/',            ctrl.get);

module.exports = router;
