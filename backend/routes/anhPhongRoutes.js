const express = require('express');
const router = express.Router();
const anhPhongController = require('../controllers/anhPhongController');

router.get('/', anhPhongController.getAll);
router.get('/phong/:id', anhPhongController.getByPhong);
router.post('/', anhPhongController.create);
router.delete('/:id', anhPhongController.remove);

module.exports = router;
