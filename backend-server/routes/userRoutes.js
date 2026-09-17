const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/', userController.getAll);
router.delete('/:id', userController.remove);
router.put('/:id/toggle-lock', userController.toggleLock);

module.exports = router;
