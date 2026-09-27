const Engagement=require('../models/Engagement');
const Comic=require('../models/Comic');
const User=require('../models/User');
const NotificationService=require('../services/notificationService');
const EmailService=require('../services/emailService');

class EngagementController{
 static async like(req,res,next){try{const c=await Comic.findById(req.params.id);if(!c)return res.status(404).json({error:'Comic not found.'});const liked=await Engagement.toggle('comic_likes',req.user.id,c.id);res.json({liked,count:await Engagement.count('comic_likes',c.id)});}catch(e){next(e)}}
 static async follow(req,res,next){try{const c=await Comic.findById(req.params.id);if(!c)return res.status(404).json({error:'Comic not found.'});const following=await Engagement.toggle('comic_follows',req.user.id,c.id);res.json({following,count:await Engagement.count('comic_follows',c.id)});}catch(e){next(e)}}
 static async rate(req,res,next){try{const c=await Comic.findById(req.params.id);if(!c)return res.status(404).json({error:'Comic not found.'});await Engagement.rate(req.user.id,c.id,Number(req.body.rating),req.body.review||'');res.json({message:'Rating saved.'});}catch(e){next(e)}}
 static async comments(req,res,next){try{res.json({comments:await Engagement.comments(req.params.id)});}catch(e){next(e)}}
 static async addComment(req,res,next){try{const c=await Comic.findById(req.params.id);if(!c)return res.status(404).json({error:'Comic not found.'});res.status(201).json({comment:await Engagement.comment(req.user.id,c.id,req.body.text)});}catch(e){next(e)}}

 static async creatorFollow(req,res,next){
   try{
     const creator=await User.findById(req.params.id);
     if(!creator || !['creator','admin'].includes(creator.role)) return res.status(404).json({error:'Creator not found.'});
     if(req.user.id===creator.id) return res.status(400).json({error:'You cannot follow yourself.'});
     const following=await Engagement.toggleCreator(req.user.id,creator.id);
     const followersCount=await Engagement.creatorFollowerCount(creator.id);
     if(following){
       NotificationService.create(
         creator.id,'new_follower','New Follower',
         `${req.user.username} started following you.`,
         {followerId:req.user.id}
       ).catch(()=>{});
       if(following && creator.email) EmailService.send({to:creator.email,subject:`${req.user.username} followed you on Elder's Veil`,text:`${req.user.username} started following your creator profile.`}).catch(()=>{});
     }
     res.json({following,followersCount});
   }catch(e){next(e)}
 }

 static async creatorFollowers(req,res,next){
   try{
     const creator=await User.findById(req.params.id);
     if(!creator || !['creator','admin'].includes(creator.role)) return res.status(404).json({error:'Creator not found.'});
     const followers=await Engagement.creatorFollowers(creator.id);
     res.json({followers,followersCount:followers.length});
   }catch(e){next(e)}
 }

 static async creatorFollowingStatus(req,res,next){
   try{
     const creator=await User.findById(req.params.id);
     if(!creator || !['creator','admin'].includes(creator.role)) return res.status(404).json({error:'Creator not found.'});
     res.json({following:await Engagement.isFollowingCreator(req.user.id,creator.id)});
   }catch(e){next(e)}
 }

 static async myFollowing(req,res,next){
   try{
     const following=await Engagement.userFollowingCreators(req.user.id);
     res.json({following,followingCount:following.length});
   }catch(e){next(e)}
 }

 static async userFollowing(req,res,next){
   try{
     const user=await User.findById(req.params.id);
     if(!user)return res.status(404).json({error:'User not found.'});
     const following=await Engagement.userFollowingCreators(user.id);
     res.json({following,followingCount:following.length});
   }catch(e){next(e)}
 }

 static async myFollowers(req,res,next){
   try{
     // Followers are users who follow this account when the account is a creator.
     const followers=await Engagement.creatorFollowers(req.user.id);
     res.json({followers,followersCount:followers.length});
   }catch(e){next(e)}
 }
}
module.exports=EngagementController;
