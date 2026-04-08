// routes/inventory.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/inventoryController');

// IMPORTANT: /deduct must come BEFORE /:id to avoid Express matching 'deduct' as an id param
router.patch('/deduct',  ctrl.deductStock);

router.get('/',          ctrl.list);
router.post('/',         ctrl.add);
router.put('/:id',       ctrl.update);
router.delete('/:id',    ctrl.remove);

module.exports = router;
