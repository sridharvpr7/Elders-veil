const Engagement=require('../models/Engagement');
const Comic=require('../models/Comic');
class EngagementController{
 static async like(req,res,next){try{const c=await Comic.findById(req.params.id);if(!c)return res.status(404).json({error:'Comic not found.'});const liked=await Engagement.toggle('comic_likes',req.user.id,c.id);res.json({liked,count:await Engagement.count('comic_likes',c.id)});}catch(e){next(e)}}
 static async follow(req,res,next){try{const c=await Comic.findById(req.params.id);if(!c)return res.status(404).json({error:'Comic not found.'});const following=await Engagement.toggle('comic_follows',req.user.id,c.id);res.json({following});}catch(e){next(e)}}
 static async rate(req,res,next){try{const c=await Comic.findById(req.params.id);if(!c)return res.status(404).json({error:'Comic not found.'});await Engagement.rate(req.user.id,c.id,Number(req.body.rating),req.body.review||'');res.json({message:'Rating saved.'});}catch(e){next(e)}}
 static async comments(req,res,next){try{res.json({comments:await Engagement.comments(req.params.id)});}catch(e){next(e)}}
 static async addComment(req,res,next){try{const c=await Comic.findById(req.params.id);if(!c)return res.status(404).json({error:'Comic not found.'});res.status(201).json({comment:await Engagement.comment(req.user.id,c.id,req.body.text)});}catch(e){next(e)}}
}
module.exports=EngagementController;
