// routes/customers.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/customersController');

router.get('/',     ctrl.list);
router.get('/:id',  ctrl.getById);
router.post('/',    ctrl.add);
router.put('/:id',  ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
