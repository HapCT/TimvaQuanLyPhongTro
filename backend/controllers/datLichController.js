const datPhongController = require('./datPhongController');

module.exports = {
  getAll: datPhongController.getAll,
  create: datPhongController.create,
  updateStatus: datPhongController.updateStatus,
};