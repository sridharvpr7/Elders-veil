const db=require('../config/database');
class Engagement {
  static async toggle(table,userId,comicId){
    const allowed=['comic_likes','comic_follows'];
    if(!allowed.includes(table))throw new Error('Invalid engagement');
    if(db.isPgConnected()){
      const col=table==='comic_likes'?'like':'follow';
      const check=await db.query(`SELECT 1 FROM ${table} WHERE user_id=$1 AND comic_id=$2`,[userId,comicId]);
      if(check.rowCount){await db.query(`DELETE FROM ${table} WHERE user_id=$1 AND comic_id=$2`,[userId,comicId]);return false;}
      await db.query(`INSERT INTO ${table}(id,user_id,comic_id) VALUES($1,$2,$3)`,[`eng-${Date.now()}-${Math.random()}`,userId,comicId]);return true;
    }
    db.fallbackStore[table]??=[];
    const arr=db.fallbackStore[table],i=arr.findIndex(x=>x.user_id===userId&&x.comic_id===comicId);
    if(i>=0){arr.splice(i,1);db.saveFallbackStore();return false;}
    arr.push({id:`eng-${Date.now()}-${Math.random()}`,user_id:userId,comic_id:comicId,created_at:new Date()});db.saveFallbackStore();return true;
  }
  static async list(table,userId){
    if(db.isPgConnected()){const r=await db.query(`SELECT c.* FROM comics c JOIN ${table} e ON e.comic_id=c.id WHERE e.user_id=$1 ORDER BY e.created_at DESC`,[userId]);return r.rows;}
    const ids=(db.fallbackStore[table]||[]).filter(x=>x.user_id===userId).map(x=>x.comic_id);
    return db.fallbackStore.comics.filter(c=>ids.includes(c.id));
  }
  static async followers(comicId){
    if(db.isPgConnected()){const r=await db.query(`SELECT user_id FROM comic_follows WHERE comic_id=$1`,[comicId]);return r.rows.map(x=>x.user_id);}
    return (db.fallbackStore.comic_follows||[]).filter(x=>x.comic_id===comicId).map(x=>x.user_id);
  }
  static async count(table,comicId){
    if(db.isPgConnected()){const r=await db.query(`SELECT COUNT(*)::int AS count FROM ${table} WHERE comic_id=$1`,[comicId]);return r.rows[0].count;}
    return (db.fallbackStore[table]||[]).filter(x=>x.comic_id===comicId).length;
  }
  static async rate(userId,comicId,rating,review=''){
    if(rating<1||rating>5)throw new Error('Rating must be between 1 and 5.');
    if(db.isPgConnected()){
      await db.query(`INSERT INTO ratings(id,user_id,comic_id,rating,review) VALUES($1,$2,$3,$4,$5)
        ON CONFLICT(user_id,comic_id) DO UPDATE SET rating=EXCLUDED.rating,review=EXCLUDED.review,updated_at=CURRENT_TIMESTAMP`,
        [`rating-${Date.now()}-${Math.random()}`,userId,comicId,rating,review]);
      await db.query(`UPDATE comics SET rating=COALESCE((SELECT AVG(rating) FROM ratings WHERE comic_id=$1),0) WHERE id=$1`,[comicId]);
      return;
    }
    db.fallbackStore.ratings??=[];const arr=db.fallbackStore.ratings;const x=arr.find(r=>r.user_id===userId&&r.comic_id===comicId);
    if(x){x.rating=rating;x.review=review;x.updated_at=new Date();}else arr.push({id:`rating-${Date.now()}`,user_id:userId,comic_id:comicId,rating,review,created_at:new Date()});
    const rs=arr.filter(r=>r.comic_id===comicId);const c=db.fallbackStore.comics.find(c=>c.id===comicId);if(c)c.rating=rs.reduce((a,b)=>a+b.rating,0)/rs.length;db.saveFallbackStore();
  }
  static async comments(comicId){
    if(db.isPgConnected()){const r=await db.query(`SELECT c.*,u.username,u.avatar FROM comments c JOIN users u ON u.id=c.user_id WHERE c.comic_id=$1 ORDER BY c.created_at DESC`,[comicId]);return r.rows;}
    return (db.fallbackStore.comments||[]).filter(c=>c.comic_id===comicId);
  }
  static async comment(userId,comicId,text){
    if(!text||text.trim().length<1||text.length>2000)throw new Error('Comment must be 1-2000 characters.');
    const id=`comment-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
    if(db.isPgConnected()){const r=await db.query(`INSERT INTO comments(id,user_id,comic_id,body) VALUES($1,$2,$3,$4) RETURNING *`,[id,userId,comicId,text.trim()]);return r.rows[0];}
    db.fallbackStore.comments??=[];const c={id,user_id:userId,comic_id:comicId,body:text.trim(),created_at:new Date()};db.fallbackStore.comments.push(c);db.saveFallbackStore();return c;
  }
}
module.exports=Engagement;
