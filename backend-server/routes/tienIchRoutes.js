const express = require('express');
const router = express.Router();
const tienIchController = require('../controllers/tienIchController');

router.get('/', tienIchController.getAll);
router.post('/', tienIchController.create);
router.put('/:id', tienIchController.update);
router.delete('/:id', tienIchController.remove);

module.exports = router;
