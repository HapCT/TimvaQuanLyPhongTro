const express = require('express');
const router = express.Router();
const thanhToanController = require('../controllers/thanhToanController');

router.get('/', thanhToanController.getAll);
router.get('/:id', thanhToanController.getById);
router.post('/', thanhToanController.create);

module.exports = router;
