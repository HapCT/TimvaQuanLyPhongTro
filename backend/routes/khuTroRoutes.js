const express = require('express');
const router = express.Router();
const khuTroController = require('../controllers/khuTroController');

router.get('/', khuTroController.getAll);
router.post('/', khuTroController.create);
router.put('/:id', khuTroController.update);
router.delete('/:id', khuTroController.remove);

module.exports = router;
