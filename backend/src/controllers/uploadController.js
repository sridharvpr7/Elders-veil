const UploadService=require('../services/uploadService');
const Comic=require('../models/Comic');
class UploadController {
 static async uploadCover(req,res,next){try{if(!req.file)return res.status(400).json({error:'No image file uploaded.'});res.json({url:await UploadService.processSingleFile(req.file,'elders-veil/covers'),message:'Cover image uploaded successfully.'});}catch(e){next(e)}}
 static async uploadBanner(req,res,next){try{if(!req.file)return res.status(400).json({error:'No image file uploaded.'});res.json({url:await UploadService.processSingleFile(req.file,'elders-veil/banners'),message:'Banner image uploaded successfully.'});}catch(e){next(e)}}
 static async uploadAvatar(req,res,next){try{if(!req.file)return res.status(400).json({error:'No avatar image uploaded.'});const url=await UploadService.processSingleFile(req.file,'elders-veil/avatars');await require('../models/User').updateProfile(req.user.id,{avatar:url});res.json({url,message:'Profile picture updated successfully.'});}catch(e){next(e)}}
 static async uploadChapterPages(req,res,next){try{const comicId=req.body.comicId;if(!comicId)return res.status(400).json({error:'comicId is required.'});const comic=await Comic.findById(comicId);if(!comic)return res.status(404).json({error:'Comic not found.'});if(req.user.role!=='admin'&&comic.creatorId!==req.user.id)return res.status(403).json({error:'You can only upload pages to your own comic.'});if(!req.files?.length)return res.status(400).json({error:'No chapter page images uploaded.'});const urls=await UploadService.processMultipleFiles(req.files,`elders-veil/comics/${comicId}`);res.json({urls,count:urls.length,message:`${urls.length} chapter pages uploaded successfully.`});}catch(e){next(e)}}
}
module.exports=UploadController;
