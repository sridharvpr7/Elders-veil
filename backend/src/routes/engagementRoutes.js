const express=require('express');const router=express.Router();const C=require('../controllers/engagementController');const {authMiddleware}=require('../middleware/authMiddleware');
router.get('/comics/:id/comments',C.comments);
router.use(authMiddleware);
router.post('/comics/:id/like',C.like);router.post('/comics/:id/follow',C.follow);router.post('/comics/:id/rating',C.rate);router.post('/comics/:id/comments',C.addComment);
router.delete('/comments/:id',C.deleteComment);router.post('/comments/:commentId/like',C.likeComment);router.post('/creators/:creatorId/follow',C.creatorFollow);router.get('/creators/following',C.creators);router.post('/reports',C.report);
module.exports=router;
