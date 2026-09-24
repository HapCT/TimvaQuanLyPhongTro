const express = require('express');
const router = express.Router();
const datLichController = require('../controllers/datLichController');
const { optionalAuth } = require('../middleware/auth');

router.get('/', optionalAuth, datLichController.getAll);
router.post('/', optionalAuth, datLichController.create);
router.put('/:id/status', optionalAuth, datLichController.updateStatus);

module.exports = router;
