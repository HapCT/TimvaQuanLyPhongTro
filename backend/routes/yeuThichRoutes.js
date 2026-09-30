const express = require('express');
const router = express.Router();
const yeuThichController = require('../controllers/yeuThichController');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, yeuThichController.getMine);
router.post('/:maPhong', requireAuth, yeuThichController.add);
router.delete('/:maPhong', requireAuth, yeuThichController.remove);

module.exports = router;