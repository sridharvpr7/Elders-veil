const express = require('express');
const router = express.Router();
const C = require('../controllers/notificationController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', C.list);
router.delete('/', C.deleteAll);
router.delete('/:id', C.deleteOne);

router.put('/read-all', C.readAll);
router.patch('/read-all', C.readAll);

router.put('/:id/read', C.read);
router.patch('/:id/read', C.read);

router.get('/preferences', C.prefs);
router.put('/preferences', C.updatePrefs);

module.exports = router;
