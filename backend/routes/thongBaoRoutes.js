const express = require('express');
const router = express.Router();
const thongBaoController = require('../controllers/thongBaoController');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, thongBaoController.getAll);
router.get('/unread-count', requireAuth, thongBaoController.getUnreadCount);
router.patch('/read-all', requireAuth, thongBaoController.markAllRead);
router.patch('/:id/read', requireAuth, thongBaoController.markRead);

module.exports = router;
