const express = require('express');
const router = express.Router();
const phongTienIchController = require('../controllers/phongTienIchController');

router.get('/', phongTienIchController.getAll);
router.get('/phong/:id', phongTienIchController.getByPhong);
router.post('/', phongTienIchController.create);
router.delete('/', phongTienIchController.remove);

module.exports = router;
