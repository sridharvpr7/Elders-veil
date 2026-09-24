const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/adminController');
const { authMiddleware } = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// Protect all admin routes
router.use(authMiddleware, adminMiddleware);

router.get('/users', AdminController.getUsers);
router.patch('/users/:id/status', AdminController.setUserStatus);
router.patch('/users/:id/premium', AdminController.setPremium);
router.patch('/users/:id/role', AdminController.setRole);
router.get('/statistics', AdminController.getStatistics);
router.get('/analytics', require('../controllers/featureController').overview);
router.get('/pending-submissions', AdminController.getPendingSubmissions);
router.get('/reports', AdminController.getReports);
router.patch('/reports/:id', AdminController.resolveReport);
router.get('/support', AdminController.getTickets);
router.patch('/support/:id', AdminController.updateTicket);
router.post('/backup', AdminController.createBackup);
router.post('/comics/import', AdminController.importComicsJson);
router.get('/comics/export', AdminController.exportComicsJson);

module.exports = router;
