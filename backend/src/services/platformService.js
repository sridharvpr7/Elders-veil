
const crypto = require('crypto');
const db = require('../config/database');
const Email = require('./emailService');
const Notification = require('./notificationService');
const env = require('../config/env');

const id = (p='pf') => `${p}-${Date.now()}-${crypto.randomBytes(5).toString('hex')}`;
const ipHash = (ip='') => crypto.createHash('sha256').update(String(ip)).digest('hex');

function todayISO(){ return new Date().toISOString().slice(0,10); }
function safe(v=''){ return String(v ?? ''); }

class PlatformService {
  static async query(sql, params=[]){ return db.query(sql,params); }
  static pg(){ return db.isPgConnected(); }

  static async track({userId=null,eventType,path='',comicId=null,chapterId=null,metadata={},ip=''}) {
    const row={id:id('event'),user_id:userId,event_type:eventType,path,comic_id:comicId,chapter_id:chapterId,metadata,ip_hash:ipHash(ip),created_at:new Date()};
    if(this.pg()) await this.query('INSERT INTO analytics_events(id,user_id,event_type,path,comic_id,chapter_id,metadata,ip_hash) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',[row.id,userId,eventType,path,comicId,chapterId,JSON.stringify(metadata),row.ip_hash]);
    else { db.fallbackStore.analytics_events.push(row); if(db.fallbackStore.analytics_events.length>50000) db.fallbackStore.analytics_events.shift(); db.saveFallbackStore(); }
  }

  static async audit({actorId,action,targetType='',targetId=null,metadata={},ip=''}) {
    const row={id:id('audit'),actor_id:actorId,action,target_type:targetType,target_id:targetId,metadata,ip_hash:ipHash(ip),created_at:new Date()};
    if(this.pg()) await this.query('INSERT INTO audit_logs(id,actor_id,action,target_type,target_id,metadata,ip_hash) VALUES($1,$2,$3,$4,$5,$6,$7)',[row.id,actorId,action,targetType,targetId,JSON.stringify(metadata),row.ip_hash]);
    else { db.fallbackStore.audit_logs.push(row); db.saveFallbackStore(); }
  }

  static async listReadings(userId) {
    if(this.pg()) {
      const r=await this.query(`SELECT rl.*, COUNT(rli.id)::int item_count FROM reading_lists rl LEFT JOIN reading_list_items rli ON rli.list_id=rl.id WHERE rl.user_id=$1 GROUP BY rl.id ORDER BY rl.updated_at DESC`,[userId]);
      return r.rows;
    }
    return db.fallbackStore.reading_lists.filter(x=>x.user_id===userId).map(x=>({...x,item_count:db.fallbackStore.reading_list_items.filter(i=>i.list_id===x.id).length}));
  }
  static async createList(userId,{name,description='',isPublic=false}) {
    if(!safe(name).trim()) throw {statusCode:400,message:'List name is required.'};
    const row={id:id('list'),user_id:userId,name:safe(name).slice(0,120),description:safe(description).slice(0,1000),is_public:!!isPublic,created_at:new Date(),updated_at:new Date()};
    if(this.pg()){const r=await this.query('INSERT INTO reading_lists(id,user_id,name,description,is_public) VALUES($1,$2,$3,$4,$5) RETURNING *',[row.id,userId,row.name,row.description,row.is_public]);return r.rows[0];}
    db.fallbackStore.reading_lists.push(row);db.saveFallbackStore();return row;
  }
  static async deleteList(userId,listId){ if(this.pg()){const r=await this.query('DELETE FROM reading_lists WHERE id=$1 AND user_id=$2 RETURNING id',[listId,userId]);return !!r.rows[0];}const i=db.fallbackStore.reading_lists.findIndex(x=>x.id===listId&&x.user_id===userId);if(i<0)return false;db.fallbackStore.reading_lists.splice(i,1);db.fallbackStore.reading_list_items=db.fallbackStore.reading_list_items.filter(x=>x.list_id!==listId);db.saveFallbackStore();return true; }
  static async listItems(userId,listId){ if(this.pg()){const r=await this.query(`SELECT rli.*,c.title,c.slug,c.cover_image,c.rating,c.views FROM reading_list_items rli JOIN reading_lists rl ON rl.id=rli.list_id JOIN comics c ON c.id=rli.comic_id WHERE rli.list_id=$1 AND rl.user_id=$2 ORDER BY rli.created_at DESC`,[listId,userId]);return r.rows;} const list=db.fallbackStore.reading_lists.find(x=>x.id===listId&&x.user_id===userId);if(!list)return [];return db.fallbackStore.reading_list_items.filter(x=>x.list_id===listId).map(i=>({...i,...(db.fallbackStore.comics.find(c=>c.id===i.comic_id)||{})}));}
  static async addListItem(userId,listId,comicId){ if(this.pg()){const own=await this.query('SELECT id FROM reading_lists WHERE id=$1 AND user_id=$2',[listId,userId]);if(!own.rows[0])throw {statusCode:404,message:'Reading list not found.'};const row={id:id('listitem')};await this.query('INSERT INTO reading_list_items(id,list_id,comic_id) VALUES($1,$2,$3) ON CONFLICT(list_id,comic_id) DO NOTHING',[row.id,listId,comicId]);await this.query('UPDATE reading_lists SET updated_at=CURRENT_TIMESTAMP WHERE id=$1',[listId]);return {added:true};} const own=db.fallbackStore.reading_lists.find(x=>x.id===listId&&x.user_id===userId);if(!own)throw {statusCode:404,message:'Reading list not found.'};if(!db.fallbackStore.reading_list_items.some(x=>x.list_id===listId&&x.comic_id===comicId))db.fallbackStore.reading_list_items.push({id:id('listitem'),list_id:listId,comic_id:comicId,created_at:new Date()});db.saveFallbackStore();return {added:true};}
  static async removeListItem(userId,listId,comicId){if(this.pg()){const r=await this.query('DELETE FROM reading_list_items i USING reading_lists l WHERE i.list_id=l.id AND i.list_id=$1 AND i.comic_id=$2 AND l.user_id=$3 RETURNING i.id',[listId,comicId,userId]);return !!r.rows[0];}const list=db.fallbackStore.reading_lists.find(x=>x.id===listId&&x.user_id===userId);if(!list)return false;const i=db.fallbackStore.reading_list_items.findIndex(x=>x.list_id===listId&&x.comic_id===comicId);if(i<0)return false;db.fallbackStore.reading_list_items.splice(i,1);db.saveFallbackStore();return true;}

  static async streak(userId,read=true) {
    const now=new Date(), d=todayISO();
    if(!this.pg()){
      let s=db.fallbackStore.reading_streaks.find(x=>x.user_id===userId);
      if(!s){s={user_id:userId,current_streak:0,longest_streak:0,last_read_date:null,total_read_days:0};db.fallbackStore.reading_streaks.push(s);}
      if(read && s.last_read_date!==d){const last=s.last_read_date?new Date(s.last_read_date):null;const diff=last?Math.round((new Date(d)-last)/86400000):999;s.current_streak=diff===1?s.current_streak+1:1;s.longest_streak=Math.max(s.longest_streak,s.current_streak);s.total_read_days++;s.last_read_date=d;db.saveFallbackStore();}
      return s;
    }
    let r=await this.query('SELECT * FROM reading_streaks WHERE user_id=$1',[userId]);let s=r.rows[0];
    if(!s){r=await this.query('INSERT INTO reading_streaks(user_id) VALUES($1) RETURNING *',[userId]);s=r.rows[0];}
    if(read && (s.last_read_date ? new Date(s.last_read_date).toISOString().slice(0,10) : '')!==d){const diff=s.last_read_date?Math.round((new Date(d)-new Date(s.last_read_date))/86400000):999;const current=diff===1?s.current_streak+1:1;r=await this.query('UPDATE reading_streaks SET current_streak=$1,longest_streak=GREATEST(longest_streak,$1),last_read_date=$2,total_read_days=total_read_days+1,updated_at=CURRENT_TIMESTAMP WHERE user_id=$3 RETURNING *',[current,d,userId]);s=r.rows[0];}
    return s;
  }

  static async achievements(userId){
    if(this.pg()){const r=await this.query(`SELECT a.*,ua.earned_at FROM achievements a LEFT JOIN user_achievements ua ON ua.achievement_id=a.id AND ua.user_id=$1 ORDER BY a.points,a.name`,[userId]);return r.rows;}
    return db.fallbackStore.achievements.map(a=>({...a,earned_at:(db.fallbackStore.user_achievements.find(x=>x.user_id===userId&&x.achievement_id===a.id)||{}).earned_at||null}));
  }
  static async evaluateAchievements(userId){
    const streak=await this.streak(userId,false);
    let chapters=0,follows=0;
    if(this.pg()){
      const c=await this.query('SELECT COUNT(*)::int count FROM reading_history WHERE user_id=$1',[userId]);chapters=c.rows[0].count;
      const f=await this.query('SELECT COUNT(*)::int count FROM creator_follows WHERE follower_id=$1',[userId]);follows=f.rows[0].count;
    } else {chapters=db.fallbackStore.reading_history.filter(x=>x.user_id===userId).length;follows=db.fallbackStore.creator_follows.filter(x=>x.follower_id===userId).length;}
    const rules=[['first_read',chapters>=1],['streak_3',streak.current_streak>=3],['streak_7',streak.current_streak>=7],['chapters_10',chapters>=10],['follow_5',follows>=5]];
    for(const [code,ok] of rules) if(ok){
      if(this.pg()) await this.query(`INSERT INTO user_achievements(user_id,achievement_id) SELECT $1,id FROM achievements WHERE code=$2 ON CONFLICT DO NOTHING`,[userId,code]);
      else {const a=db.fallbackStore.achievements.find(x=>x.code===code);if(a&&!db.fallbackStore.user_achievements.some(x=>x.user_id===userId&&x.achievement_id===a.id))db.fallbackStore.user_achievements.push({user_id:userId,achievement_id:a.id,earned_at:new Date()});}
    }
    if(!this.pg())db.saveFallbackStore();
    return this.achievements(userId);
  }

  static async preferences(userId){
    if(this.pg()){let r=await this.query('SELECT * FROM reader_preferences WHERE user_id=$1',[userId]);if(!r.rows[0]){r=await this.query('INSERT INTO reader_preferences(user_id) VALUES($1) RETURNING *',[userId]);}return r.rows[0];}
    let p=db.fallbackStore.reader_preferences.find(x=>x.user_id===userId);if(!p){p={user_id:userId,reading_mode:'vertical',fit_mode:'width',image_quality:'high',auto_scroll:false,auto_scroll_speed:2,show_progress:true};db.fallbackStore.reader_preferences.push(p);db.saveFallbackStore();}return p;
  }
  static async savePreferences(userId,b){
    const p=await this.preferences(userId);const v={reading_mode:['vertical','horizontal','single'].includes(b.readingMode)?b.readingMode:p.reading_mode,fit_mode:['width','contain','original'].includes(b.fitMode)?b.fitMode:p.fit_mode,image_quality:['low','medium','high'].includes(b.imageQuality)?b.imageQuality:p.image_quality,auto_scroll:b.autoScroll===undefined?p.auto_scroll:!!b.autoScroll,auto_scroll_speed:Math.min(10,Math.max(1,Number(b.autoScrollSpeed)||2)),show_progress:b.showProgress===undefined?p.show_progress:!!b.showProgress};
    if(this.pg()){const r=await this.query(`UPDATE reader_preferences SET reading_mode=$1,fit_mode=$2,image_quality=$3,auto_scroll=$4,auto_scroll_speed=$5,show_progress=$6,updated_at=CURRENT_TIMESTAMP WHERE user_id=$7 RETURNING *`,[v.reading_mode,v.fit_mode,v.image_quality,v.auto_scroll,v.auto_scroll_speed,v.show_progress,userId]);return r.rows[0];}
    Object.assign(p,v);db.saveFallbackStore();return p;
  }

  static async comments(comicId){
    if(this.pg()){const r=await this.query(`SELECT c.*,u.username,u.avatar,(SELECT COUNT(*)::int FROM comment_likes cl WHERE cl.comment_id=c.id) likes FROM comments c LEFT JOIN users u ON u.id=c.user_id WHERE c.comic_id=$1 ORDER BY c.created_at DESC`,[comicId]);return r.rows;}
    return db.fallbackStore.comments.filter(c=>c.comic_id===comicId).map(c=>({...c,likes:db.fallbackStore.comment_likes.filter(x=>x.comment_id===c.id).length}));
  }
  static async addComment(userId,comicId,body,{parentId=null,spoiler=false}={}){
    if(!safe(body).trim())throw {statusCode:400,message:'Comment cannot be empty.'};
    const row={id:id('comment'),user_id:userId,comic_id:comicId,body:safe(body).slice(0,4000),parent_id:parentId,is_spoiler:!!spoiler,is_pinned:false,created_at:new Date()};
    if(this.pg()){const r=await this.query('INSERT INTO comments(id,user_id,comic_id,body,parent_id,is_spoiler) VALUES($1,$2,$3,$4,$5,$6) RETURNING *',[row.id,userId,comicId,row.body,parentId,row.is_spoiler]);return r.rows[0];}
    db.fallbackStore.comments.push(row);db.saveFallbackStore();return row;
  }
  static async moderateComment(commentId,{pin=false,deleteComment=false}={}){
    if(this.pg()){
      if(deleteComment){const r=await this.query('DELETE FROM comments WHERE id=$1 RETURNING id',[commentId]);return {deleted:!!r.rows[0]};}
      const r=await this.query('UPDATE comments SET is_pinned=$1 WHERE id=$2 RETURNING *',[!!pin,commentId]);return {comment:r.rows[0]||null};
    }
    const c=db.fallbackStore.comments.find(x=>x.id===commentId);if(!c)return {deleted:false};if(deleteComment){db.fallbackStore.comments=db.fallbackStore.comments.filter(x=>x.id!==commentId);db.fallbackStore.comment_likes=db.fallbackStore.comment_likes.filter(x=>x.comment_id!==commentId);db.saveFallbackStore();return {deleted:true};}c.is_pinned=!!pin;db.saveFallbackStore();return {comment:c};
  }

  static async toggleCommentLike(userId,commentId){
    if(this.pg()){const x=await this.query('SELECT id FROM comment_likes WHERE user_id=$1 AND comment_id=$2',[userId,commentId]);if(x.rows[0]){await this.query('DELETE FROM comment_likes WHERE id=$1',[x.rows[0].id]);}else await this.query('INSERT INTO comment_likes(id,user_id,comment_id) VALUES($1,$2,$3)',[id('clike'),userId,commentId]);const c=await this.query('SELECT COUNT(*)::int count FROM comment_likes WHERE comment_id=$1',[commentId]);return {liked:!x.rows[0],count:c.rows[0].count};}
    const i=db.fallbackStore.comment_likes.findIndex(x=>x.user_id===userId&&x.comment_id===commentId);let liked=false;if(i>=0)db.fallbackStore.comment_likes.splice(i,1);else{db.fallbackStore.comment_likes.push({id:id('clike'),user_id:userId,comment_id:commentId});liked=true;}db.saveFallbackStore();return {liked,count:db.fallbackStore.comment_likes.filter(x=>x.comment_id===commentId).length};
  }

  static async syncProgress(userId,{comicId,chapterId,pageNumber=1}){
    const page=Math.max(1,Number(pageNumber)||1);
    if(this.pg()){await this.query(`INSERT INTO reading_history(id,user_id,comic_id,chapter_id,page_number) VALUES($1,$2,$3,$4,$5) ON CONFLICT(user_id,comic_id) DO UPDATE SET chapter_id=EXCLUDED.chapter_id,page_number=EXCLUDED.page_number,updated_at=CURRENT_TIMESTAMP`,[id('hist'),userId,comicId,chapterId,page]);}
    else {let h=db.fallbackStore.reading_history.find(x=>x.user_id===userId&&x.comic_id===comicId);if(!h){h={id:id('hist'),user_id:userId,comic_id:comicId,chapter_id:chapterId,page_number:page,updated_at:new Date()};db.fallbackStore.reading_history.push(h);}else Object.assign(h,{chapter_id:chapterId,page_number:page,updated_at:new Date()});db.saveFallbackStore();}
    const streak=await this.streak(userId,true);await this.evaluateAchievements(userId);return {saved:true,pageNumber:page,streak};
  }

  static async offlineManifest(chapterId,userId){
    let r;
    if(this.pg())r=await this.query(`SELECT ch.id,ch.comic_id,ch.chapter_number,ch.title,c.title comic_title, json_agg(cp.image_url ORDER BY cp.page_number) pages FROM chapters ch JOIN comics c ON c.id=ch.comic_id LEFT JOIN chapter_pages cp ON cp.chapter_id=ch.id WHERE ch.id=$1 GROUP BY ch.id,c.title`,[chapterId]);
    else {const ch=db.fallbackStore.chapters.find(x=>x.id===chapterId);if(!ch)return null;const c=db.fallbackStore.comics.find(x=>x.id===ch.comic_id);r={rows:[{...ch,comic_title:c?.title,pages:db.fallbackStore.chapter_pages.filter(x=>x.chapter_id===chapterId).sort((a,b)=>a.page_number-b.page_number).map(x=>x.image_url)}]};}
    if(!r.rows[0])return null;const row=r.rows[0];if(this.pg())await this.query('INSERT INTO offline_downloads(id,user_id,chapter_id) VALUES($1,$2,$3) ON CONFLICT(user_id,chapter_id) DO NOTHING',[id('offline'),userId,chapterId]);return row;
  }

  static async discover(type,userId=null){
    if(this.pg()){
      if(type==='trending'){const r=await this.query(`SELECT c.*, COALESCE(f.follows,0) follows, COALESCE(l.likes,0) likes FROM comics c LEFT JOIN (SELECT comic_id,COUNT(*) follows FROM comic_follows GROUP BY comic_id) f ON f.comic_id=c.id LEFT JOIN (SELECT comic_id,COUNT(*) likes FROM comic_likes GROUP BY comic_id) l ON l.comic_id=c.id WHERE c.publish_status='published' ORDER BY (c.views*0.55 + COALESCE(f.follows,0)*8 + COALESCE(l.likes,0)*5 + EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP-c.created_at))/86400*-0.15) DESC LIMIT 30`);return r.rows;}
      if(type==='rising'){const r=await this.query(`SELECT c.*,COUNT(DISTINCT rh.user_id)::int recent_readers FROM comics c LEFT JOIN reading_history rh ON rh.comic_id=c.id AND rh.updated_at >= CURRENT_TIMESTAMP - INTERVAL '14 days' WHERE c.publish_status='published' GROUP BY c.id ORDER BY recent_readers DESC,c.created_at DESC LIMIT 30`);return r.rows;}
      if(userId){const r=await this.query(`SELECT c.*,COUNT(*)::int matches FROM comics c JOIN comic_genres cg ON cg.comic_id=c.id WHERE c.publish_status='published' AND cg.genre_id IN (SELECT cg2.genre_id FROM comic_genres cg2 JOIN favorites f ON f.comic_id=cg2.comic_id WHERE f.user_id=$1 UNION SELECT cg3.genre_id FROM comic_genres cg3 JOIN comic_follows cf ON cf.comic_id=cg3.comic_id WHERE cf.user_id=$1) GROUP BY c.id ORDER BY matches DESC,c.views DESC LIMIT 30`,[userId]);return r.rows;}
      return (await this.discover('trending',null)).slice(0,20);
    }
    let comics=db.fallbackStore.comics.filter(c=>(c.publish_status||'published')==='published');return comics.sort((a,b)=>(b.views||0)-(a.views||0)).slice(0,30);
  }

  static async analyticsOverview(days=30){
    const since=new Date(Date.now()-Number(days)*86400000);
    if(this.pg()){const [ev,u,c,ch,f] = await Promise.all([
      this.query(`SELECT event_type,COUNT(*)::int count FROM analytics_events WHERE created_at>=$1 GROUP BY event_type ORDER BY count DESC`,[since]),
      this.query(`SELECT COUNT(*)::int count FROM users WHERE created_at>=$1`,[since]),
      this.query(`SELECT COUNT(*)::int count FROM comics WHERE created_at>=$1`,[since]),
      this.query(`SELECT COUNT(*)::int count FROM chapters WHERE created_at>=$1`,[since]),
      this.query(`SELECT COUNT(*)::int count FROM creator_follows WHERE created_at>=$1`,[since])
    ]);return {days,newUsers:u.rows[0].count,newComics:c.rows[0].count,newChapters:ch.rows[0].count,newCreatorFollows:f.rows[0].count,events:ev.rows};}
    const es=db.fallbackStore.analytics_events.filter(e=>new Date(e.created_at)>=since);return {days,newUsers:db.fallbackStore.users.filter(x=>new Date(x.created_at)>=since).length,newComics:db.fallbackStore.comics.filter(x=>new Date(x.created_at)>=since).length,newChapters:db.fallbackStore.chapters.filter(x=>new Date(x.created_at)>=since).length,newCreatorFollows:db.fallbackStore.creator_follows.filter(x=>new Date(x.created_at)>=since).length,events:Object.values(es.reduce((a,x)=>(a[x.event_type]=(a[x.event_type]||0)+1,a),{})).map((count,i)=>({event_type:Object.keys(es.reduce((a,x)=>(a[x.event_type]=1,a),{}))[i],count}))};
  }

  static async creatorAnalytics(creatorId,days=30){
    if(this.pg()){
      const [c,v,f,events] = await Promise.all([
        this.query(`SELECT COUNT(*)::int comics,COALESCE(SUM(views),0)::bigint views,COALESCE(AVG(rating),0)::numeric rating FROM comics WHERE creator_id=$1`,[creatorId]),
        this.query(`SELECT COALESCE(SUM(ch.views),0)::bigint chapter_views,COUNT(ch.id)::int chapters FROM chapters ch JOIN comics c ON c.id=ch.comic_id WHERE c.creator_id=$1`,[creatorId]),
        this.query('SELECT COUNT(*)::int followers FROM creator_follows WHERE creator_id=$1',[creatorId]),
        this.query(`SELECT event_type,COUNT(*)::int count FROM analytics_events e JOIN comics c ON c.id=e.comic_id WHERE c.creator_id=$1 AND e.created_at>=CURRENT_TIMESTAMP-$2::int*INTERVAL '1 day' GROUP BY event_type ORDER BY count DESC`,[creatorId,Number(days)||30])
      ]);
      return {...c.rows[0],...v.rows[0],...f.rows[0],events:events.rows};
    }
    const cs=db.fallbackStore.comics.filter(x=>x.creator_id===creatorId), followers=db.fallbackStore.creator_follows.filter(x=>x.creator_id===creatorId).length;return {comics:cs.length,views:cs.reduce((n,x)=>n+(x.views||0),0),chapters:db.fallbackStore.chapters.filter(ch=>cs.some(c=>c.id===ch.comic_id)).length,followers,events:[]};
  }

  static async notificationPreferences(userId){
    if(this.pg()){let r=await this.query('SELECT * FROM notification_preferences WHERE user_id=$1',[userId]);if(!r.rows[0]){r=await this.query('INSERT INTO notification_preferences(user_id) VALUES($1) RETURNING *',[userId]);}return r.rows[0];}
    let p=db.fallbackStore.notification_preferences.find(x=>x.user_id===userId);if(!p){p={user_id:userId,new_comic_email:true,new_chapter_email:true,email_enabled:true,in_app_enabled:true,new_follower_email:true,comment_email:true,achievement_email:false};db.fallbackStore.notification_preferences.push(p);db.saveFallbackStore();}return p;
  }
  static async saveNotificationPreferences(userId,b){
    const p=await this.notificationPreferences(userId);const v={new_comic_email:b.newComicEmail===undefined?p.new_comic_email:!!b.newComicEmail,new_chapter_email:b.newChapterEmail===undefined?p.new_chapter_email:!!b.newChapterEmail,email_enabled:b.emailEnabled===undefined?p.email_enabled:!!b.emailEnabled,in_app_enabled:b.inAppEnabled===undefined?p.in_app_enabled:!!b.inAppEnabled,new_follower_email:b.newFollowerEmail===undefined?p.new_follower_email:!!b.newFollowerEmail,comment_email:b.commentEmail===undefined?p.comment_email:!!b.commentEmail,achievement_email:b.achievementEmail===undefined?p.achievement_email:!!b.achievementEmail};
    if(this.pg()){const r=await this.query(`UPDATE notification_preferences SET new_comic_email=$1,new_chapter_email=$2,email_enabled=$3,in_app_enabled=$4,new_follower_email=$5,comment_email=$6,achievement_email=$7 WHERE user_id=$8 RETURNING *`,[v.new_comic_email,v.new_chapter_email,v.email_enabled,v.in_app_enabled,v.new_follower_email,v.comment_email,v.achievement_email,userId]);return r.rows[0];}
    Object.assign(p,v);db.saveFallbackStore();return p;
  }

  static async settings(userId,settings){
    if(this.pg()){await this.query('UPDATE users SET accessibility_settings=$1,bio=COALESCE($2,bio),updated_at=CURRENT_TIMESTAMP WHERE id=$3',[JSON.stringify(settings.accessibility||{}),settings.bio??null,userId]);return;}
    const u=db.fallbackStore.users.find(x=>x.id===userId);if(u){u.accessibility_settings=settings.accessibility||u.accessibility_settings||{};if(settings.bio!==undefined)u.bio=safe(settings.bio).slice(0,500);db.saveFallbackStore();} 
  }

  // TOTP without an extra dependency.
  static base32(buf){return buf.toString('base64').replace(/=/g,'').replace(/\+/g,'').replace(/\//g,'').toUpperCase().replace(/[^A-Z2-7]/g,'').slice(0,32);}
  static base32Decode(str){let bits='',out=[];const alpha='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';for(const ch of str.replace(/=+$/,'').toUpperCase()){const v=alpha.indexOf(ch);if(v<0)continue;bits+=v.toString(2).padStart(5,'0');while(bits.length>=8){out.push(parseInt(bits.slice(0,8),2));bits=bits.slice(8);}}return Buffer.from(out);}
  static totp(secret,time=Math.floor(Date.now()/1000)){const key=this.base32Decode(secret),counter=Math.floor(time/30);const b=Buffer.alloc(8);b.writeBigUInt64BE(BigInt(counter));const h=crypto.createHmac('sha1',key).update(b).digest();const o=h[h.length-1]&15;const n=(h.readUInt32BE(o)&0x7fffffff)%1000000;return String(n).padStart(6,'0');}
  static verifyTotp(secret,code){const c=String(code).replace(/\D/g,'');for(let d=-1;d<=1;d++)if(this.totp(secret,Math.floor(Date.now()/1000)+d*30)===c)return true;return false;}
  static async setup2fa(userId){const secret=this.base32(crypto.randomBytes(20));if(this.pg())await this.query('UPDATE users SET two_factor_secret=$1,two_factor_enabled=false WHERE id=$2',[secret,userId]);else{const u=db.fallbackStore.users.find(x=>x.id===userId);if(u){u.two_factor_secret=secret;u.two_factor_enabled=false;db.saveFallbackStore();}}return {secret,otpauth:`otpauth://totp/EldersVeil?secret=${secret}&issuer=EldersVeil`};}
  static async verify2fa(userId,code){let secret=null;if(this.pg()){const r=await this.query('SELECT two_factor_secret FROM users WHERE id=$1',[userId]);secret=r.rows[0]?.two_factor_secret;}else secret=db.fallbackStore.users.find(x=>x.id===userId)?.two_factor_secret;if(!secret||!this.verifyTotp(secret,code))throw {statusCode:400,message:'Invalid authenticator code.'};if(this.pg())await this.query('UPDATE users SET two_factor_enabled=true WHERE id=$1',[userId]);else{const u=db.fallbackStore.users.find(x=>x.id===userId);if(u)u.two_factor_enabled=true;db.saveFallbackStore();}return {enabled:true};}
  static async disable2fa(userId,code){let secret=null;if(this.pg()){const r=await this.query('SELECT two_factor_secret FROM users WHERE id=$1',[userId]);secret=r.rows[0]?.two_factor_secret;}else secret=db.fallbackStore.users.find(x=>x.id===userId)?.two_factor_secret;if(!secret||!this.verifyTotp(secret,code))throw {statusCode:400,message:'Invalid authenticator code.'};if(this.pg())await this.query('UPDATE users SET two_factor_enabled=false,two_factor_secret=NULL WHERE id=$1',[userId]);else{const u=db.fallbackStore.users.find(x=>x.id===userId);if(u){u.two_factor_enabled=false;u.two_factor_secret=null;db.saveFallbackStore();}}return {enabled:false};}

  static async createSession(userId,{deviceName='Browser',userAgent='',ip='' }={}){
    const row={id:id('session'),user_id:userId,device_name:safe(deviceName).slice(0,200),user_agent:safe(userAgent).slice(0,1000),ip_hash:ipHash(ip),last_seen_at:new Date(),created_at:new Date(),revoked_at:null};
    if(this.pg()){const r=await this.query('INSERT INTO user_sessions(id,user_id,device_name,user_agent,ip_hash) VALUES($1,$2,$3,$4,$5) RETURNING id,device_name,user_agent,last_seen_at,created_at',[row.id,userId,row.device_name,row.user_agent,row.ip_hash]);return r.rows[0];}
    db.fallbackStore.user_sessions.push(row);db.saveFallbackStore();return row;
  }
  static async sessions(userId){
    if(this.pg()){const r=await this.query('SELECT id,device_name,user_agent,last_seen_at,created_at,revoked_at FROM user_sessions WHERE user_id=$1 ORDER BY last_seen_at DESC',[userId]);return r.rows;}
    return db.fallbackStore.user_sessions.filter(x=>x.user_id===userId).sort((a,b)=>new Date(b.last_seen_at)-new Date(a.last_seen_at));
  }
  static async revokeSession(userId,sid){if(this.pg()){const r=await this.query('UPDATE user_sessions SET revoked_at=CURRENT_TIMESTAMP WHERE id=$1 AND user_id=$2 RETURNING id',[sid,userId]);return !!r.rows[0];}const s=db.fallbackStore.user_sessions.find(x=>x.id===sid&&x.user_id===userId);if(!s)return false;s.revoked_at=new Date();db.saveFallbackStore();return true;}

  static async report({userId,targetType,targetId,reason,details}){const row={id:id('report'),reporter_id:userId,target_type:targetType,target_id:targetId,reason:safe(reason).slice(0,100),details:safe(details).slice(0,4000),status:'open',created_at:new Date()};if(this.pg()){const r=await this.query('INSERT INTO reports(id,reporter_id,target_type,target_id,reason,details) VALUES($1,$2,$3,$4,$5,$6) RETURNING *',[row.id,userId,targetType,targetId,row.reason,row.details]);return r.rows[0];}db.fallbackStore.reports.push(row);db.saveFallbackStore();return row;}

  static async banners(){if(this.pg()){const r=await this.query(`SELECT * FROM homepage_banners WHERE active=true AND (starts_at IS NULL OR starts_at<=CURRENT_TIMESTAMP) AND (ends_at IS NULL OR ends_at>=CURRENT_TIMESTAMP) ORDER BY sort_order,id`);return r.rows;}return db.fallbackStore.homepage_banners.filter(x=>x.active);}
  static async picks(){if(this.pg()){const r=await this.query(`SELECT ep.*,c.title,c.slug,c.cover_image,c.rating,c.views FROM editor_picks ep JOIN comics c ON c.id=ep.comic_id WHERE ep.active=true ORDER BY ep.sort_order,ep.created_at DESC`);return r.rows;}return db.fallbackStore.editor_picks.filter(x=>x.active).map(x=>({...x,...(db.fallbackStore.comics.find(c=>c.id===x.comic_id)||{})}));}
  static async tipOrder(senderId,creatorId,amountInr,message=''){
    const amount=Math.max(10,Number(amountInr)||0)*100;if(!amount)throw {statusCode:400,message:'Tip amount is required.'};
    if(this.pg()){const u=await this.query(`SELECT id,username FROM users WHERE id=$1 AND role IN ('creator','admin')`,[creatorId]);if(!u.rows[0])throw {statusCode:404,message:'Creator not found.'};const row={id:id('tip'),sender_id:senderId,creator_id:creatorId,amount_paise:amount,currency:'INR',provider:'razorpay',status:'created',message:safe(message).slice(0,500)};if(!env.RAZORPAY_KEY_ID||!env.RAZORPAY_KEY_SECRET)return {configured:false,tip:row};const auth=Buffer.from(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`).toString('base64');const rr=await fetch('https://api.razorpay.com/v1/orders',{method:'POST',headers:{Authorization:`Basic ${auth}`,'Content-Type':'application/json'},body:JSON.stringify({amount,currency:'INR',receipt:row.id,notes:{senderId,creatorId,type:'creator_tip'}})});const data=await rr.json();if(!rr.ok)throw new Error(data.error?.description||'Tip order failed.');await this.query('INSERT INTO creator_tips(id,sender_id,creator_id,amount_paise,currency,provider,status,message) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',[row.id,senderId,creatorId,amount,'INR','razorpay','created',row.message]);return {configured:true,keyId:env.RAZORPAY_KEY_ID,tip:row,order:data};}
    return {configured:false,error:'Creator tips require PostgreSQL + Razorpay configuration.'};
  }
  static async verifyTip(senderId,{tipId,orderId,paymentId,signature}){
    const expected=crypto.createHmac('sha256',env.RAZORPAY_KEY_SECRET||'').update(`${orderId}|${paymentId}`).digest('hex');if(!env.RAZORPAY_KEY_SECRET||expected!==signature)throw {statusCode:400,message:'Payment signature verification failed.'};
    if(this.pg()){const r=await this.query('UPDATE creator_tips SET status=$1,provider_payment_id=$2 WHERE id=$3 AND sender_id=$4 RETURNING *',['paid',paymentId,tipId,senderId]);if(!r.rows[0])throw {statusCode:404,message:'Tip not found.'};await this.query(`INSERT INTO creator_earnings(creator_id,total_tips_paise) VALUES($1,$2) ON CONFLICT(creator_id) DO UPDATE SET total_tips_paise=creator_earnings.total_tips_paise+EXCLUDED.total_tips_paise,updated_at=CURRENT_TIMESTAMP`,[r.rows[0].creator_id,r.rows[0].amount_paise]);return r.rows[0];}
    return {id:tipId,status:'paid'};
  }
  static async upsertRecap(chapterId,recap,actor){if(this.pg()){const r=await this.query(`INSERT INTO chapter_recaps(chapter_id,recap,generated_by) VALUES($1,$2,$3) ON CONFLICT(chapter_id) DO UPDATE SET recap=EXCLUDED.recap,generated_by=EXCLUDED.generated_by,updated_at=CURRENT_TIMESTAMP RETURNING *`,[chapterId,safe(recap).slice(0,12000),actor]);return r.rows[0];}const x=db.fallbackStore.chapter_recaps.find(x=>x.chapter_id===chapterId);if(x)x.recap=recap;else db.fallbackStore.chapter_recaps.push({chapter_id:chapterId,recap,generated_by:actor,updated_at:new Date()});db.saveFallbackStore();return {chapter_id:chapterId,recap};}
  static async upsertAudio(chapterId,b,actor){const row={chapter_id:chapterId,audio_url:safe(b.audioUrl),duration_seconds:Number(b.durationSeconds)||0,voice_name:safe(b.voiceName),updated_at:new Date()};if(this.pg()){const r=await this.query(`INSERT INTO chapter_audio(chapter_id,audio_url,duration_seconds,voice_name) VALUES($1,$2,$3,$4) ON CONFLICT(chapter_id) DO UPDATE SET audio_url=EXCLUDED.audio_url,duration_seconds=EXCLUDED.duration_seconds,voice_name=EXCLUDED.voice_name,updated_at=CURRENT_TIMESTAMP RETURNING *`,[chapterId,row.audio_url,row.duration_seconds,row.voice_name]);return r.rows[0];}db.fallbackStore.chapter_audio=db.fallbackStore.chapter_audio.filter(x=>x.chapter_id!==chapterId);db.fallbackStore.chapter_audio.push(row);db.saveFallbackStore();return row;}
  static async upsertMotion(chapterId,manifest){const row={chapter_id:chapterId,manifest,updated_at:new Date()};if(this.pg()){const r=await this.query(`INSERT INTO chapter_motion(chapter_id,manifest) VALUES($1,$2) ON CONFLICT(chapter_id) DO UPDATE SET manifest=EXCLUDED.manifest,updated_at=CURRENT_TIMESTAMP RETURNING *`,[chapterId,JSON.stringify(manifest)]);return r.rows[0];}db.fallbackStore.chapter_motion=db.fallbackStore.chapter_motion.filter(x=>x.chapter_id!==chapterId);db.fallbackStore.chapter_motion.push(row);db.saveFallbackStore();return row;}
  static async upsertUniverse(body){const uid=body.id||id('universe');if(this.pg()){const r=await this.query(`INSERT INTO story_universes(id,comic_id,title,description) VALUES($1,$2,$3,$4) ON CONFLICT(comic_id) DO UPDATE SET title=EXCLUDED.title,description=EXCLUDED.description RETURNING *`,[uid,body.comicId,body.title,body.description||'']);return r.rows[0];}const x=db.fallbackStore.story_universes.find(x=>x.comic_id===body.comicId);if(x){Object.assign(x,{title:body.title,description:body.description||''});return x;}const row={id:uid,comic_id:body.comicId,title:body.title,description:body.description||'',created_at:new Date()};db.fallbackStore.story_universes.push(row);db.saveFallbackStore();return row;}
  static async upsertInteractive(body){const sid=body.id||id('story');if(this.pg()){const s=await this.query(`INSERT INTO interactive_stories(id,chapter_id,title,intro,active) VALUES($1,$2,$3,$4,$5) ON CONFLICT(chapter_id) DO UPDATE SET title=EXCLUDED.title,intro=EXCLUDED.intro,active=EXCLUDED.active RETURNING *`,[sid,body.chapterId,body.title,body.intro||'',body.active!==false]);for(const c of (body.choices||[])){await this.query(`INSERT INTO interactive_choices(id,story_id,label,description,next_chapter_id,sort_order) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(id) DO UPDATE SET label=EXCLUDED.label,description=EXCLUDED.description,next_chapter_id=EXCLUDED.next_chapter_id,sort_order=EXCLUDED.sort_order`,[c.id||id('choice'),sid,c.label,c.description||'',c.nextChapterId||null,Number(c.sortOrder)||0]);}return s.rows[0];}return {id:sid,...body};}

  static async adminBanner(body,actor){const row={id:id('banner'),title:safe(body.title).slice(0,200),subtitle:safe(body.subtitle).slice(0,1000),image_url:safe(body.imageUrl),link_url:safe(body.linkUrl),active:body.active!==false,sort_order:Number(body.sortOrder)||0,created_by:actor};if(!row.image_url)throw {statusCode:400,message:'Banner image URL is required.'};if(this.pg()){const r=await this.query('INSERT INTO homepage_banners(id,title,subtitle,image_url,link_url,active,sort_order,created_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',[row.id,row.title,row.subtitle,row.image_url,row.link_url,row.active,row.sort_order,actor]);return r.rows[0];}db.fallbackStore.homepage_banners.push(row);db.saveFallbackStore();return row;}
  static async adminPick(body,actor){const row={id:id('pick'),comic_id:body.comicId,note:safe(body.note).slice(0,1000),sort_order:Number(body.sortOrder)||0,active:body.active!==false,created_by:actor};if(this.pg()){const r=await this.query('INSERT INTO editor_picks(id,comic_id,note,sort_order,active,created_by) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(comic_id) DO UPDATE SET note=EXCLUDED.note,sort_order=EXCLUDED.sort_order,active=EXCLUDED.active RETURNING *',[row.id,row.comic_id,row.note,row.sort_order,row.active,actor]);return r.rows[0];}db.fallbackStore.editor_picks=db.fallbackStore.editor_picks.filter(x=>x.comic_id!==row.comic_id);db.fallbackStore.editor_picks.push(row);db.saveFallbackStore();return row;}

  static async universe(comicId){if(this.pg()){const u=await this.query('SELECT * FROM story_universes WHERE comic_id=$1',[comicId]);if(!u.rows[0])return null;const uid=u.rows[0].id;const [ch,loc,ev,rel]=await Promise.all([this.query('SELECT * FROM story_characters WHERE universe_id=$1',[uid]),this.query('SELECT * FROM story_locations WHERE universe_id=$1',[uid]),this.query('SELECT * FROM story_events WHERE universe_id=$1 ORDER BY sort_order',[uid]),this.query('SELECT * FROM story_relations WHERE universe_id=$1',[uid])]);return {...u.rows[0],characters:ch.rows,locations:loc.rows,events:ev.rows,relations:rel.rows};}const u=db.fallbackStore.story_universes.find(x=>x.comic_id===comicId);if(!u)return null;return {...u,characters:db.fallbackStore.story_characters.filter(x=>x.universe_id===u.id),locations:db.fallbackStore.story_locations.filter(x=>x.universe_id===u.id),events:db.fallbackStore.story_events.filter(x=>x.universe_id===u.id),relations:db.fallbackStore.story_relations.filter(x=>x.universe_id===u.id)};}
  static async recap(chapterId){if(this.pg()){const r=await this.query('SELECT * FROM chapter_recaps WHERE chapter_id=$1',[chapterId]);return r.rows[0]||null;}return db.fallbackStore.chapter_recaps.find(x=>x.chapter_id===chapterId)||null;}
  static async media(chapterId){if(this.pg()){const [a,m]=await Promise.all([this.query('SELECT * FROM chapter_audio WHERE chapter_id=$1',[chapterId]),this.query('SELECT * FROM chapter_motion WHERE chapter_id=$1',[chapterId])]);return {audio:a.rows[0]||null,motion:m.rows[0]||null};}return {audio:db.fallbackStore.chapter_audio.find(x=>x.chapter_id===chapterId)||null,motion:db.fallbackStore.chapter_motion.find(x=>x.chapter_id===chapterId)||null};}
  static async interactive(chapterId){if(this.pg()){const s=await this.query('SELECT * FROM interactive_stories WHERE chapter_id=$1 AND active=true',[chapterId]);if(!s.rows[0])return null;const c=await this.query('SELECT * FROM interactive_choices WHERE story_id=$1 ORDER BY sort_order',[s.rows[0].id]);return {...s.rows[0],choices:c.rows};}const s=db.fallbackStore.interactive_stories.find(x=>x.chapter_id===chapterId&&x.active);if(!s)return null;return {...s,choices:db.fallbackStore.interactive_choices.filter(x=>x.story_id===s.id).sort((a,b)=>a.sort_order-b.sort_order)};}
}
module.exports=PlatformService;
