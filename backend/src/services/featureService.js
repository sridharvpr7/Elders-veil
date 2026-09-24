const crypto = require('crypto');
const db = require('../config/database');
const env = require('../config/env');

class FeatureService {
  static hashIp(ip='') { return crypto.createHash('sha256').update(String(ip||'')).digest('hex'); }
  static id(prefix='id') { return `${prefix}-${Date.now()}-${crypto.randomBytes(5).toString('hex')}`; }

  static async audit({actorId=null, action, targetType='', targetId=null, metadata={}, ip=''}) {
    const id=this.id('audit'); const ipHash=this.hashIp(ip);
    if (db.isPgConnected()) {
      await db.query('INSERT INTO audit_logs(id,actor_id,action,target_type,target_id,metadata,ip_hash) VALUES($1,$2,$3,$4,$5,$6,$7)',[id,actorId,action,targetType,targetId,JSON.stringify(metadata),ipHash]);
      return;
    }
    db.fallbackStore.audit_logs.push({id,actor_id:actorId,action,target_type:targetType,target_id:targetId,metadata,ip_hash:ipHash,created_at:new Date()}); db.saveFallbackStore();
  }

  static async analytics({userId=null,eventType,path='',comicId=null,chapterId=null,metadata={},ip=''}) {
    const id=this.id('event'); const ipHash=this.hashIp(ip);
    if (db.isPgConnected()) {
      await db.query('INSERT INTO analytics_events(id,user_id,event_type,path,comic_id,chapter_id,metadata,ip_hash) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',[id,userId,eventType,path,comicId,chapterId,JSON.stringify(metadata),ipHash]);
      return;
    }
    db.fallbackStore.analytics_events.push({id,user_id:userId,event_type:eventType,path,comic_id:comicId,chapter_id:chapterId,metadata,ip_hash:ipHash,created_at:new Date()});
    if(db.fallbackStore.analytics_events.length>50000) db.fallbackStore.analytics_events.shift(); db.saveFallbackStore();
  }

  static async createReport({reporterId,targetType,targetId,reason,details=''}) {
    if(!targetType || !reason) throw {statusCode:400,message:'Report type and reason are required.'};
    const id=this.id('report');
    if(db.isPgConnected()) { const r=await db.query('INSERT INTO reports(id,reporter_id,target_type,target_id,reason,details) VALUES($1,$2,$3,$4,$5,$6) RETURNING *',[id,reporterId,targetType,targetId||null,String(reason).slice(0,100),String(details).slice(0,4000)]); return r.rows[0]; }
    const row={id,reporter_id:reporterId,target_type:targetType,target_id:targetId||null,reason:String(reason).slice(0,100),details:String(details).slice(0,4000),status:'open',created_at:new Date(),updated_at:new Date()}; db.fallbackStore.reports.push(row); db.saveFallbackStore(); return row;
  }

  static async reports(status='open') {
    if(db.isPgConnected()) { const r=await db.query(`SELECT r.*,u.username AS reporter_username FROM reports r LEFT JOIN users u ON u.id=r.reporter_id ${status?'WHERE r.status=$1':''} ORDER BY r.created_at DESC`, status?[status]:[]); return r.rows; }
    return db.fallbackStore.reports.filter(r=>!status||r.status===status).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
  }

  static async resolveReport(id,{adminId,status='resolved',adminNote=''}) {
    if(db.isPgConnected()) { const r=await db.query('UPDATE reports SET status=$1,admin_note=$2,resolved_by=$3,updated_at=CURRENT_TIMESTAMP WHERE id=$4 RETURNING *',[status,adminNote,adminId,id]); return r.rows[0]||null; }
    const r=db.fallbackStore.reports.find(x=>x.id===id); if(!r)return null;r.status=status;r.admin_note=adminNote;r.resolved_by=adminId;r.updated_at=new Date();db.saveFallbackStore();return r;
  }

  static async overview(days=30) {
    const since = new Date(Date.now()-Math.max(1,Number(days)||30)*86400000);
    if(db.isPgConnected()) {
      const [ev, users, comics, chapters, premium] = await Promise.all([
        db.query(`SELECT event_type, COUNT(*)::int AS count FROM analytics_events WHERE created_at >= $1 GROUP BY event_type ORDER BY count DESC`,[since]),
        db.query(`SELECT COUNT(*)::int AS count FROM users WHERE created_at >= $1`,[since]),
        db.query(`SELECT COUNT(*)::int AS count FROM comics WHERE created_at >= $1`,[since]),
        db.query(`SELECT COUNT(*)::int AS count FROM chapters WHERE created_at >= $1`,[since]),
        db.query(`SELECT COUNT(*)::int AS count FROM users WHERE is_premium=true AND premium_expires_at > CURRENT_TIMESTAMP`,[])
      ]);
      return {days:Number(days)||30,newUsers:users.rows[0].count,newComics:comics.rows[0].count,newChapters:chapters.rows[0].count,activePremiumUsers:premium.rows[0].count,events:ev.rows};
    }
    const es=db.fallbackStore.analytics_events.filter(e=>new Date(e.created_at)>=since); const count=(type)=>es.filter(e=>e.event_type===type).length;
    return {days:Number(days)||30,newUsers:db.fallbackStore.users.filter(u=>new Date(u.created_at)>=since).length,newComics:db.fallbackStore.comics.filter(c=>new Date(c.created_at)>=since).length,newChapters:db.fallbackStore.chapters.filter(c=>new Date(c.created_at)>=since).length,activePremiumUsers:db.fallbackStore.users.filter(u=>u.is_premium&&(!u.premium_expires_at||new Date(u.premium_expires_at)>new Date())).length,events:[{event_type:'page_view',count:count('page_view')},{event_type:'reader_open',count:count('reader_open')},{event_type:'comic_view',count:count('comic_view')}].filter(x=>x.count>0)};
  }

  static async tickets(userId) {
    if(db.isPgConnected()){const r=await db.query('SELECT * FROM support_tickets WHERE user_id=$1 ORDER BY created_at DESC',[userId]);return r.rows;}
    return db.fallbackStore.support_tickets.filter(t=>t.user_id===userId).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
  }
  static async createTicket(userId,subject,message){ if(!subject||!message)throw {statusCode:400,message:'Subject and message are required.'}; const id=this.id('ticket'); if(db.isPgConnected()){const r=await db.query('INSERT INTO support_tickets(id,user_id,subject,message) VALUES($1,$2,$3,$4) RETURNING *',[id,userId,String(subject).slice(0,255),String(message).slice(0,8000)]);return r.rows[0];}const t={id,user_id:userId,subject,message,status:'open',created_at:new Date(),updated_at:new Date()};db.fallbackStore.support_tickets.push(t);db.saveFallbackStore();return t;}
  static async allTickets(status=''){if(db.isPgConnected()){const r=await db.query(`SELECT t.*,u.username FROM support_tickets t LEFT JOIN users u ON u.id=t.user_id ${status?'WHERE t.status=$1':''} ORDER BY t.created_at DESC`,status?[status]:[]);return r.rows;}return db.fallbackStore.support_tickets.filter(t=>!status||t.status===status).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));}
  static async updateTicket(id,status,adminReply){if(db.isPgConnected()){const r=await db.query('UPDATE support_tickets SET status=$1,admin_reply=$2,updated_at=CURRENT_TIMESTAMP WHERE id=$3 RETURNING *',[status,adminReply||'',id]);return r.rows[0]||null;}const t=db.fallbackStore.support_tickets.find(x=>x.id===id);if(!t)return null;t.status=status;t.admin_reply=adminReply||'';t.updated_at=new Date();db.saveFallbackStore();return t;}
}
module.exports=FeatureService;
