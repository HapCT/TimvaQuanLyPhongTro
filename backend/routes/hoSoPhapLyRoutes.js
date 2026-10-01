const express = require('express');
const router = express.Router();
const hoSoPhapLyController = require('../controllers/hoSoPhapLyController');

router.get('/', hoSoPhapLyController.getAll);
router.get('/phong/:id', hoSoPhapLyController.getByPhong);
router.post('/', hoSoPhapLyController.create);
router.delete('/:id', hoSoPhapLyController.remove);

module.exports = router;
