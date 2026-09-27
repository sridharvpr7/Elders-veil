
const Platform=require('../services/platformService');
const db=require('../config/database');
const env=require('../config/env');
const User=require('../models/User');
const crypto=require('crypto');

class PlatformController {
 static async lists(req,res,next){try{res.json({lists:await Platform.listReadings(req.user.id)});}catch(e){next(e)}}
 static async createList(req,res,next){try{res.status(201).json({list:await Platform.createList(req.user.id,req.body)});}catch(e){next(e)}}
 static async deleteList(req,res,next){try{if(!await Platform.deleteList(req.user.id,req.params.id))return res.status(404).json({error:'Reading list not found.'});res.json({deleted:true});}catch(e){next(e)}}
 static async listItems(req,res,next){try{res.json({items:await Platform.listItems(req.user.id,req.params.id)});}catch(e){next(e)}}
 static async addListItem(req,res,next){try{res.json(await Platform.addListItem(req.user.id,req.params.id,req.body.comicId));}catch(e){next(e)}}
 static async removeListItem(req,res,next){try{res.json({removed:await Platform.removeListItem(req.user.id,req.params.id,req.params.comicId)});}catch(e){next(e)}}

 static async streak(req,res,next){try{res.json({streak:await Platform.streak(req.user.id,req.body?.markRead!==false),achievements:await Platform.evaluateAchievements(req.user.id)});}catch(e){next(e)}}
 static async achievements(req,res,next){try{res.json({achievements:await Platform.achievements(req.user.id)});}catch(e){next(e)}}
 static async prefs(req,res,next){try{if(req.method==='GET')return res.json({preferences:await Platform.preferences(req.user.id)});res.json({preferences:await Platform.savePreferences(req.user.id,req.body)});}catch(e){next(e)}}
 static async notificationPreferences(req,res,next){try{if(req.method==='GET')return res.json({preferences:await Platform.notificationPreferences(req.user.id)});res.json({preferences:await Platform.saveNotificationPreferences(req.user.id,req.body)});}catch(e){next(e)}}
 static async settings(req,res,next){try{await Platform.settings(req.user.id,req.body);res.json({saved:true});}catch(e){next(e)}}
 static async progress(req,res,next){try{res.json(await Platform.syncProgress(req.user.id,req.body));}catch(e){next(e)}}
 static async offline(req,res,next){try{const row=await Platform.offlineManifest(req.params.id,req.user.id);if(!row)return res.status(404).json({error:'Chapter not found.'});res.json({manifest:row});}catch(e){next(e)}}

 static async comments(req,res,next){try{res.json({comments:await Platform.comments(req.params.id)});}catch(e){next(e)}}
 static async comment(req,res,next){try{res.status(201).json({comment:await Platform.addComment(req.user.id,req.params.id,req.body.body,{parentId:req.body.parentId||null,spoiler:!!req.body.spoiler})});}catch(e){next(e)}}
 static async commentLike(req,res,next){try{res.json(await Platform.toggleCommentLike(req.user.id,req.params.id));}catch(e){next(e)}}

 static async discover(req,res,next){try{res.json({items:await Platform.discover(req.params.type,req.user?.id||null),type:req.params.type});}catch(e){next(e)}}
 static async banners(req,res,next){try{res.json({banners:await Platform.banners(),picks:await Platform.picks()});}catch(e){next(e)}}
 static async analytics(req,res,next){try{res.json(await Platform.analyticsOverview(req.query.days||30));}catch(e){next(e)}}
 static async creatorAnalytics(req,res,next){try{const creatorId=req.params.id||req.user.id;res.json(await Platform.creatorAnalytics(creatorId,req.query.days||30));}catch(e){next(e)}}
 static async track(req,res,next){try{await Platform.track({userId:req.user?.id||null,...req.body,ip:req.ip});res.status(204).end();}catch(e){next(e)}}
 static async report(req,res,next){try{res.status(201).json({report:await Platform.report({userId:req.user.id,...req.body})});}catch(e){next(e)}}

 static async createSession(req,res,next){try{res.status(201).json({session:await Platform.createSession(req.user.id,{deviceName:req.body.deviceName,userAgent:req.headers['user-agent'],ip:req.ip})});}catch(e){next(e)}}
 static async sessions(req,res,next){try{res.json({sessions:await Platform.sessions(req.user.id)});}catch(e){next(e)}}
 static async revokeSession(req,res,next){try{res.json({revoked:await Platform.revokeSession(req.user.id,req.params.id)});}catch(e){next(e)}}

 static async setup2fa(req,res,next){try{res.json(await Platform.setup2fa(req.user.id));}catch(e){next(e)}}
 static async verify2fa(req,res,next){try{res.json(await Platform.verify2fa(req.user.id,req.body.code));}catch(e){next(e)}}
 static async disable2fa(req,res,next){try{res.json(await Platform.disable2fa(req.user.id,req.body.code));}catch(e){next(e)}}

 static async universe(req,res,next){try{res.json({universe:await Platform.universe(req.params.comicId)});}catch(e){next(e)}}
 static async recap(req,res,next){try{res.json({recap:await Platform.recap(req.params.chapterId)});}catch(e){next(e)}}
 static async media(req,res,next){try{res.json(await Platform.media(req.params.chapterId));}catch(e){next(e)}}
 static async interactive(req,res,next){try{res.json({story:await Platform.interactive(req.params.chapterId)});}catch(e){next(e)}}

 static async adminBanner(req,res,next){try{res.status(201).json({banner:await Platform.adminBanner(req.body,req.user.id)});}catch(e){next(e)}}
 static async adminPick(req,res,next){try{res.status(201).json({pick:await Platform.adminPick(req.body,req.user.id)});}catch(e){next(e)}}
 static async moderateComment(req,res,next){try{const result=await Platform.moderateComment(req.params.id,{pin:req.body.pin,deleteComment:req.body.deleteComment});await Platform.audit({actorId:req.user.id,action:req.body.deleteComment?'delete_comment':'moderate_comment',targetType:'comment',targetId:req.params.id,metadata:req.body,ip:req.ip});res.json(result);}catch(e){next(e)}}
 static async adminReports(req,res,next){try{if(db.isPgConnected()){const r=await db.query(`SELECT r.*,u.username reporter_username FROM reports r LEFT JOIN users u ON u.id=r.reporter_id ORDER BY r.created_at DESC LIMIT 500`);return res.json({reports:r.rows});}res.json({reports:db.fallbackStore.reports||[]});}catch(e){next(e)}}
 static async resolveReport(req,res,next){try{if(db.isPgConnected()){const r=await db.query('UPDATE reports SET status=$1,admin_note=$2,resolved_by=$3,updated_at=CURRENT_TIMESTAMP WHERE id=$4 RETURNING *',[req.body.status||'resolved',req.body.adminNote||'',req.user.id,req.params.id]);if(!r.rows[0])return res.status(404).json({error:'Report not found.'});await Platform.audit({actorId:req.user.id,action:'resolve_report',targetType:'report',targetId:req.params.id,metadata:req.body,ip:req.ip});return res.json({report:r.rows[0]});}const x=(db.fallbackStore.reports||[]).find(x=>x.id===req.params.id);if(!x)return res.status(404).json({error:'Report not found.'});Object.assign(x,{status:req.body.status||'resolved',admin_note:req.body.adminNote||'',resolved_by:req.user.id,updated_at:new Date()});db.saveFallbackStore();res.json({report:x});}catch(e){next(e)}}
 static async audit(req,res,next){try{if(db.isPgConnected()){const r=await db.query(`SELECT a.*,u.username FROM audit_logs a LEFT JOIN users u ON u.id=a.actor_id ORDER BY a.created_at DESC LIMIT 500`);return res.json({logs:r.rows});}res.json({logs:(db.fallbackStore.audit_logs||[]).slice(-500).reverse()});}catch(e){next(e)}}

 static async tipOrder(req,res,next){try{res.json(await Platform.tipOrder(req.user.id,req.body.creatorId,req.body.amount,req.body.message||''));}catch(e){next(e)}}
 static async verifyTip(req,res,next){try{res.json({tip:await Platform.verifyTip(req.user.id,req.body)});}catch(e){next(e)}}
 static async adminRecap(req,res,next){try{res.json({recap:await Platform.upsertRecap(req.params.chapterId,req.body.recap,req.user.id)});}catch(e){next(e)}}
 static async adminAudio(req,res,next){try{res.json({audio:await Platform.upsertAudio(req.params.chapterId,req.body,req.user.id)});}catch(e){next(e)}}
 static async adminMotion(req,res,next){try{res.json({motion:await Platform.upsertMotion(req.params.chapterId,req.body.manifest||{})});}catch(e){next(e)}}
 static async adminUniverse(req,res,next){try{res.json({universe:await Platform.upsertUniverse(req.body)});}catch(e){next(e)}}
 static async adminInteractive(req,res,next){try{res.json({story:await Platform.upsertInteractive(req.body)});}catch(e){next(e)}}
 static async subscriptionOrder(req,res,next){
   try{
     const amount=Math.max(1,Number(req.body.amount||env.PREMIUM_PRICE_INR||499))*100;
     if(!env.RAZORPAY_KEY_ID||!env.RAZORPAY_KEY_SECRET)return res.status(503).json({configured:false,error:'Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.'});
     const auth=Buffer.from(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`).toString('base64');
     const rr=await fetch('https://api.razorpay.com/v1/orders',{method:'POST',headers:{Authorization:`Basic ${auth}`,'Content-Type':'application/json'},body:JSON.stringify({amount,currency:'INR',receipt:`ev-${Date.now()}`,notes:{userId:req.user.id,plan:req.body.plan||'premium_monthly'}})});
     const data=await rr.json();if(!rr.ok)throw new Error(data.error?.description||'Unable to create payment order.');
     if(db.isPgConnected())await db.query(`INSERT INTO subscriptions(id,user_id,plan,status,provider,provider_order_id,amount_paise,currency) VALUES($1,$2,$3,'created','razorpay',$4,$5,'INR')`,[`sub-${Date.now()}`,req.user.id,req.body.plan||'premium_monthly',data.id,amount]);
     res.json({configured:true,keyId:env.RAZORPAY_KEY_ID,order:data});
   }catch(e){next(e)}
 }
 static async verifyPayment(req,res,next){
   try{
     const {orderId,paymentId,signature}=req.body;
     if(!orderId||!paymentId||!signature)return res.status(400).json({error:'Payment verification fields are required.'});
     const expected=crypto.createHmac('sha256',env.RAZORPAY_KEY_SECRET||'').update(`${orderId}|${paymentId}`).digest('hex');
     if(!env.RAZORPAY_KEY_SECRET||expected!==signature)return res.status(400).json({error:'Payment signature verification failed.'});
     const months=Math.max(1,Number(req.body.months)||1);
     const user=await User.findById(req.user.id);const expiry=new Date(Math.max(Date.now(),new Date(user?.premium_expires_at||0).getTime()));expiry.setMonth(expiry.getMonth()+months);
     if(db.isPgConnected())await db.query(`UPDATE users SET is_premium=true,premium_status='active',premium_approved_at=CURRENT_TIMESTAMP,premium_expires_at=$1 WHERE id=$2`,[expiry,req.user.id]);
     if(db.isPgConnected())await db.query(`UPDATE subscriptions SET status='paid',provider_payment_id=$1,started_at=CURRENT_TIMESTAMP,expires_at=$2 WHERE user_id=$3 AND provider_order_id=$4`,[paymentId,expiry,req.user.id,orderId]);
     await Platform.audit({actorId:req.user.id,action:'premium_payment_verified',targetType:'subscription',targetId:orderId,metadata:{paymentId,months},ip:req.ip});
     res.json({verified:true,premiumExpiresAt:expiry});
   }catch(e){next(e)}
 }
}
module.exports=PlatformController;
