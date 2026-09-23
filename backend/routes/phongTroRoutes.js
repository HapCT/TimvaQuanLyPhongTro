const express = require('express');
const router = express.Router();
const phongTroController = require('../controllers/phongTroController');

router.get('/', phongTroController.getAll);
router.get('/:id', phongTroController.getById);
router.post('/', phongTroController.create);
router.put('/:id', phongTroController.update);
router.delete('/:id', phongTroController.remove);

module.exports = router;
