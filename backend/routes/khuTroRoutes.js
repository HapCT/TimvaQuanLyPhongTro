const express = require('express');
const router = express.Router();
const khuTroController = require('../controllers/khuTroController');
const { requireRole } = require('../middleware/auth');

router.get('/', khuTroController.getAll);
router.post('/', requireRole('ChuTro', 'QuanTri'), khuTroController.create);
router.put('/:id', requireRole('ChuTro', 'QuanTri'), khuTroController.update);
router.delete('/:id', requireRole('ChuTro', 'QuanTri'), khuTroController.remove);

module.exports = router;