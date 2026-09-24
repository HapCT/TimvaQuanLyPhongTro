const express = require('express');
const router = express.Router();
const datPhongController = require('../controllers/datPhongController');
const { optionalAuth } = require('../middleware/auth');

router.get('/', optionalAuth, datPhongController.getAll);
router.post('/', optionalAuth, datPhongController.create);
router.put('/:id/status', optionalAuth, datPhongController.updateStatus);

module.exports = router;
