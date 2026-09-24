const express=require('express');const router=express.Router();const C=require('../controllers/featureController');const {authMiddleware,optionalAuthMiddleware}=require('../middleware/authMiddleware');
router.post('/analytics',optionalAuthMiddleware,C.track);router.post('/reports',authMiddleware,C.report);router.post('/ai',authMiddleware,C.ai);
module.exports=router;
