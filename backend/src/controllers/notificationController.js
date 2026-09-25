const NotificationService=require('../services/notificationService');
const env=require('../config/env');
class NotificationController{
 static whatsappStatus(req,res){res.json({configured:!!(env.WHATSAPP_ACCESS_TOKEN&&env.WHATSAPP_PHONE_NUMBER_ID),phoneNumberId:env.WHATSAPP_PHONE_NUMBER_ID?`${String(env.WHATSAPP_PHONE_NUMBER_ID).slice(0,4)}…${String(env.WHATSAPP_PHONE_NUMBER_ID).slice(-4)}`:null,businessAccountId:env.WHATSAPP_BUSINESS_ACCOUNT_ID||null,webhookConfigured:!!env.WHATSAPP_VERIFY_TOKEN,autoReplyEnabled:env.WHATSAPP_AUTO_REPLY_ENABLED,apiVersion:env.WHATSAPP_API_VERSION,language:env.WHATSAPP_TEMPLATE_LANGUAGE,welcomeTemplate:env.WHATSAPP_WELCOME_TEMPLATE,
adminPromotedTemplate:env.WHATSAPP_ADMIN_PROMOTED_TEMPLATE,
adminRemovedTemplate:env.WHATSAPP_ADMIN_REMOVED_TEMPLATE,
accountDeletedTemplate:env.WHATSAPP_ACCOUNT_DELETED_TEMPLATE});}
 static async list(req,res,next){try{res.json({notifications:await NotificationService.list(req.user.id)});}catch(e){next(e)}}
 static async read(req,res,next){try{await NotificationService.markRead(req.user.id,req.params.id);res.json({message:'Notification marked as read.'});}catch(e){next(e)}}
 static async prefs(req,res,next){try{res.json({preferences:await NotificationService.preferences(req.user.id)});}catch(e){next(e)}}
 static async updatePrefs(req,res,next){try{res.json({preferences:await NotificationService.updatePreferences(req.user.id,req.body)});}catch(e){next(e)}}
}
module.exports=NotificationController;
