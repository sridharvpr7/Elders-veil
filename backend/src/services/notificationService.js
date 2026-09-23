const db = require('../config/database');
const env = require('../config/env');

class NotificationService {
  static async create(userId, type, title, message, data = {}) {
    const id = `notif-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
    const now = new Date();
    if (db.isPgConnected()) {
      await db.query(`INSERT INTO notifications (id,user_id,type,title,message,data,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [id,userId,type,title,message,JSON.stringify(data),now]);
    } else {
      db.fallbackStore.notifications ??= [];
      db.fallbackStore.notifications.push({id,user_id:userId,type,title,message,data,read:false,created_at:now});
      db.saveFallbackStore();
    }
    return {id,userId,type,title,message,data,read:false,createdAt:now};
  }

  static async list(userId, limit=50) {
    if (db.isPgConnected()) {
      const r=await db.query(`SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT $2`,[userId,limit]);
      return r.rows.map(n=>({...n,data:typeof n.data==='string'?JSON.parse(n.data||'{}'):n.data,createdAt:n.created_at}));
    }
    return (db.fallbackStore.notifications||[]).filter(n=>n.user_id===userId).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)).slice(0,limit).map(n=>({...n,createdAt:n.created_at}));
  }

  static async markRead(userId,id) {
    if(db.isPgConnected()){await db.query(`UPDATE notifications SET read=true WHERE id=$1 AND user_id=$2`,[id,userId]);}
    else {const n=(db.fallbackStore.notifications||[]).find(x=>x.id===id&&x.user_id===userId);if(n)n.read=true;db.saveFallbackStore();}
  }

  static async preferences(userId) {
    if(db.isPgConnected()){
      const r=await db.query(`SELECT * FROM notification_preferences WHERE user_id=$1`,[userId]);
      return r.rows[0] || {user_id:userId,new_comic_whatsapp:true,new_chapter_whatsapp:true,email_enabled:true,in_app_enabled:true};
    }
    const p=(db.fallbackStore.notification_preferences||[]).find(x=>x.user_id===userId);
    return p || {user_id:userId,new_comic_whatsapp:true,new_chapter_whatsapp:true,email_enabled:true,in_app_enabled:true};
  }

  static async updatePreferences(userId, data) {
    const p=await this.preferences(userId);
    const merged={...p,...data,user_id:userId};
    if(db.isPgConnected()){
      await db.query(`INSERT INTO notification_preferences (user_id,new_comic_whatsapp,new_chapter_whatsapp,email_enabled,in_app_enabled)
        VALUES ($1,$2,$3,$4,$5)
        ON CONFLICT(user_id) DO UPDATE SET new_comic_whatsapp=EXCLUDED.new_comic_whatsapp,new_chapter_whatsapp=EXCLUDED.new_chapter_whatsapp,email_enabled=EXCLUDED.email_enabled,in_app_enabled=EXCLUDED.in_app_enabled`,
        [userId,!!merged.new_comic_whatsapp,!!merged.new_chapter_whatsapp,!!merged.email_enabled,!!merged.in_app_enabled]);
    } else {
      db.fallbackStore.notification_preferences ??=[];
      const i=db.fallbackStore.notification_preferences.findIndex(x=>x.user_id===userId);
      if(i>=0)db.fallbackStore.notification_preferences[i]=merged;else db.fallbackStore.notification_preferences.push(merged);
      db.saveFallbackStore();
    }
    return merged;
  }

  static async whatsapp(user, template, params={}) {
    if(!env.WHATSAPP_ACCESS_TOKEN || !env.WHATSAPP_PHONE_NUMBER_ID) {
      return {sent:false,reason:'WhatsApp provider is not configured.'};
    }
    const phone=String(user.phone||'').replace(/\D/g,'');
    if(!phone) return {sent:false,reason:'No mobile number available.'};
    // Meta Cloud API. Template must be approved in WhatsApp Business Manager.
    const url=`https://graph.facebook.com/v20.0/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
    const components=[{type:'body',parameters:Object.values(params).map(v=>({type:'text',text:String(v)}))}];
    try {
      const r=await fetch(url,{method:'POST',headers:{Authorization:`Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,'Content-Type':'application/json'},
        body:JSON.stringify({messaging_product:'whatsapp',to:phone,type:'template',template:{name:template,language:{code:env.WHATSAPP_TEMPLATE_LANGUAGE||'en_US'},components}})});
      const body=await r.json().catch(()=>({}));
      return {sent:r.ok,status:r.status,providerMessageId:body?.messages?.[0]?.id,body};
    } catch(e){ return {sent:false,reason:e.message}; }
  }

  static async broadcastNewComic(comic, UserModel) {
    const users=await UserModel.getAll();
    for(const user of users){
      const prefs=await this.preferences(user.id);
      if(prefs.in_app_enabled!==false) await this.create(user.id,'new_comic','New comic released',`${comic.title} is now available.`,{comicId:comic.id,slug:comic.slug});
      if(prefs.new_comic_whatsapp!==false) await this.whatsapp(user,'elder_veil_new_comic',{name:user.username,title:comic.title,url:`${env.FRONTEND_URL||''}/comic.html?slug=${comic.slug}`});
    }
  }

  static async broadcastNewChapter(comic, chapter, UserModel, followerIds=[]) {
    const users=await UserModel.getAll();
    const ids=[...new Set((users||[]).map(u=>u.id))];
    for(const uid of ids){
      const user=await UserModel.findById(uid); if(!user)continue;
      const prefs=await this.preferences(uid);
      if(prefs.in_app_enabled!==false) await this.create(uid,'new_chapter','New chapter released',`${comic.title} — Chapter ${chapter.chapterNumber} is available.`,{comicId:comic.id,chapterId:chapter.id});
      if(prefs.new_chapter_whatsapp!==false) await this.whatsapp(user,'elder_veil_new_chapter',{name:user.username,title:comic.title,chapter:`Chapter ${chapter.chapterNumber}`,url:`${env.FRONTEND_URL||''}/reader.html?id=${chapter.id}`});
    }
  }
}
module.exports=NotificationService;
