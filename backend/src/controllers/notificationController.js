const NotificationService=require('../services/notificationService');
class NotificationController{
 static async stream(req,res){res.setHeader('Content-Type','text/event-stream');res.setHeader('Cache-Control','no-cache');res.setHeader('Connection','keep-alive');res.flushHeaders?.();let closed=false;const send=async()=>{try{const n=await NotificationService.list(req.user.id,5);if(!closed)res.write(`event: notifications\ndata: ${JSON.stringify(n)}\n\n`)}catch(_e){}};req.on('close',()=>{closed=true;clearInterval(timer)});const timer=setInterval(()=>send(),20000);send();}
 static async list(req,res,next){try{res.json({notifications:await NotificationService.list(req.user.id)});}catch(e){next(e)}}
 static async read(req,res,next){try{await NotificationService.markRead(req.user.id,req.params.id);res.json({message:'Notification marked as read.'});}catch(e){next(e)}}
 static async prefs(req,res,next){try{res.json({preferences:await NotificationService.preferences(req.user.id)});}catch(e){next(e)}}
 static async updatePrefs(req,res,next){try{res.json({preferences:await NotificationService.updatePreferences(req.user.id,req.body)});}catch(e){next(e)}}
}
module.exports=NotificationController;
