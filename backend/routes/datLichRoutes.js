const express = require('express');
const router = express.Router();
const datLichController = require('../controllers/datLichController');

router.get('/', datLichController.getAll);
router.post('/', datLichController.create);
router.put('/:id/status', datLichController.updateStatus);

module.exports = router;
