const Engagement=require('../models/Engagement');const Comic=require('../models/Comic');const Feature=require('../services/featureService');
class EngagementController {
 static async like(req,res,next){try{const c=await Comic.findById(req.params.id);if(!c)return res.status(404).json({error:'Comic not found.'});const liked=await Engagement.toggle('comic_likes',req.user.id,c.id);res.json({liked,count:await Engagement.count('comic_likes',c.id)});}catch(e){next(e)}}
 static async follow(req,res,next){try{const c=await Comic.findById(req.params.id);if(!c)return res.status(404).json({error:'Comic not found.'});const following=await Engagement.toggle('comic_follows',req.user.id,c.id);res.json({following});}catch(e){next(e)}}
 static async rate(req,res,next){try{const c=await Comic.findById(req.params.id);if(!c)return res.status(404).json({error:'Comic not found.'});await Engagement.rate(req.user.id,c.id,Number(req.body.rating),req.body.review||'');res.json({message:'Rating saved.'});}catch(e){next(e)}}
 static async comments(req,res,next){try{res.json({comments:await Engagement.comments(req.params.id)});}catch(e){next(e)}}
 static async addComment(req,res,next){try{const c=await Comic.findById(req.params.id);if(!c)return res.status(404).json({error:'Comic not found.'});const comment=await Engagement.comment(req.user.id,c.id,req.body.text,req.body.parentCommentId||null);res.status(201).json({comment});}catch(e){next(e)}}
 static async deleteComment(req,res,next){try{const ok=await Engagement.deleteComment(req.params.id,req.user.id,req.user.role==='admin');if(!ok)return res.status(404).json({error:'Comment not found or not yours.'});res.json({message:'Comment removed.'});}catch(e){next(e)}}
 static async likeComment(req,res,next){try{res.json({liked:await Engagement.likeComment(req.user.id,req.params.commentId)});}catch(e){next(e)}}
 static async creatorFollow(req,res,next){try{const following=await Engagement.toggleCreatorFollow(req.user.id,req.params.creatorId);res.json({following});}catch(e){next(e)}}
 static async creators(req,res,next){try{res.json({creators:await Engagement.listFollowingCreators(req.user.id)});}catch(e){next(e)}}
 static async report(req,res,next){try{res.status(201).json({report:await Feature.createReport({reporterId:req.user.id,...req.body})});}catch(e){next(e)}}
}
module.exports=EngagementController;
