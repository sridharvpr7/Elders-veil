const express=require('express');
const router=express.Router();
const C=require('../controllers/engagementController');
const {authMiddleware,optionalAuthMiddleware}=require('../middleware/authMiddleware');

router.post('/comics/:id/like',authMiddleware,C.like);
router.post('/comics/:id/follow',authMiddleware,C.follow);
router.post('/comics/:id/rating',authMiddleware,C.rate);
router.get('/comics/:id/comments',optionalAuthMiddleware,C.comments);
router.post('/comics/:id/comments',authMiddleware,C.addComment);

router.post('/creators/:id/follow',authMiddleware,C.creatorFollow);
router.get('/creators/:id/followers',authMiddleware,C.creatorFollowers);
router.get('/creators/:id/following-status',authMiddleware,C.creatorFollowingStatus);
router.get('/me/following',authMiddleware,C.myFollowing);
router.get('/users/:id/following',authMiddleware,C.userFollowing);
router.get('/me/followers',authMiddleware,C.myFollowers);

module.exports=r;
