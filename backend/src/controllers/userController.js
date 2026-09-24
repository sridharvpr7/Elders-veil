const User = require('../models/User');
const Bookmark = require('../models/Bookmark');
const Favorite = require('../models/Favorite');
const ReadingHistory = require('../models/ReadingHistory');

class UserController {

  static async getPublicCreator(req,res,next){try{const u=await User.findById(req.params.id);if(!u||!['creator','admin'].includes(u.role))return res.status(404).json({error:'Creator not found.'});const Comic=require('../models/Comic');const comics=await Comic.getAll({creatorId:u.id,limit:50,sortBy:'latest'});let following=false;if(req.user)following=await require('../models/Engagement').state('creator_follows',req.user.id,u.id);res.json({creator:{id:u.id,username:u.username,avatar:u.avatar,role:u.role,createdAt:u.created_at||u.createdAt},comics,following});}catch(e){next(e)}}

  static async getProfile(req, res) {
    res.status(200).json({ user: req.user });
  }

  static async updateProfile(req, res, next) {
    try {
      const { username, avatar } = req.body;
      const updatedUser = await User.updateProfile(req.user.id, { username, avatar });
      res.status(200).json({ user: updatedUser, message: 'Profile updated successfully.' });
    } catch (err) {
      next(err);
    }
  }


  static async becomeCreator(req, res, next) {
    try {
      const user = await User.becomeCreator(req.user.id);
      if (!user) return res.status(403).json({ error: 'Unable to activate creator mode for this account.' });
      res.json({ user, message: 'Creator mode activated.' });
    } catch (err) { next(err); }
  }

  static async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Current password and new password are required.' });
      }

      const fullUser = await User.findByEmail(req.user.email);
      const isMatch = await User.verifyPassword(fullUser, currentPassword);
      if (!isMatch) {
        return res.status(400).json({ error: 'Current password is incorrect.' });
      }

      await User.updatePassword(req.user.id, newPassword);
      res.status(200).json({ message: 'Password updated successfully.' });
    } catch (err) {
      next(err);
    }
  }

  static async getBookmarks(req, res, next) {
    try {
      const bookmarks = await Bookmark.getByUserId(req.user.id);
      res.status(200).json({ bookmarks });
    } catch (err) {
      next(err);
    }
  }

  static async addBookmark(req, res, next) {
    try {
      const { comicId } = req.body;
      if (!comicId) return res.status(400).json({ error: 'comicId is required.' });
      await Bookmark.add(req.user.id, comicId);
      res.status(200).json({ message: 'Comic added to bookmarks.' });
    } catch (err) {
      next(err);
    }
  }

  static async removeBookmark(req, res, next) {
    try {
      await Bookmark.remove(req.user.id, req.params.comicId);
      res.status(200).json({ message: 'Comic removed from bookmarks.' });
    } catch (err) {
      next(err);
    }
  }

  static async getFavorites(req, res, next) {
    try {
      const favorites = await Favorite.getByUserId(req.user.id);
      res.status(200).json({ favorites });
    } catch (err) {
      next(err);
    }
  }

  static async addFavorite(req, res, next) {
    try {
      const { comicId } = req.body;
      if (!comicId) return res.status(400).json({ error: 'comicId is required.' });
      await Favorite.add(req.user.id, comicId);
      res.status(200).json({ message: 'Comic added to favorites.' });
    } catch (err) {
      next(err);
    }
  }

  static async removeFavorite(req, res, next) {
    try {
      await Favorite.remove(req.user.id, req.params.comicId);
      res.status(200).json({ message: 'Comic removed from favorites.' });
    } catch (err) {
      next(err);
    }
  }

  static async getHistory(req, res, next) {
    try {
      const history = await ReadingHistory.getByUserId(req.user.id);
      res.status(200).json({ history });
    } catch (err) {
      next(err);
    }
  }

  static async saveHistory(req, res, next) {
    try {
      const { comicId, chapterId, pageNumber } = req.body;
      if (!comicId || !chapterId) {
        return res.status(400).json({ error: 'comicId and chapterId are required.' });
      }
      await ReadingHistory.saveProgress(req.user.id, comicId, chapterId, pageNumber || 1);
      res.status(200).json({ message: 'Reading progress saved.' });
    } catch (err) {
      next(err);
    }
  }
  static async getRecommendations(req,res,next){try{
    const histories=await ReadingHistory.getByUserId(req.user.id);
    const liked=await require('../models/Engagement').list('comic_likes',req.user.id);
    const followed=await require('../models/Engagement').list('comic_follows',req.user.id);
    const seen=new Set(histories.map(h=>h.comicId));
    const seedIds=[...new Set([...liked,...followed].map(c=>c.id)),...histories.map(h=>h.comicId)];
    const all=await require('../models/Comic').getAll({limit:100,sortBy:'trending'});
    const seeds=all.filter(c=>seedIds.includes(c.id));
    const genres=new Set(seeds.flatMap(c=>Array.isArray(c.genres)?c.genres.map(g=>String(g).toLowerCase()):[]));
    const recs=all.filter(c=>!seen.has(c.id)).map(c=>{const g=(c.genres||[]).filter(x=>genres.has(String(x).toLowerCase())).length;return {...c,_score:g*10+Number(c.rating||0)*2+Math.min(Number(c.views||0)/1000,10)}}).sort((a,b)=>b._score-a._score).slice(0,12).map(({_score,...c})=>c);
    res.json({recommendations:recs});
  }catch(e){next(e)}}

  static async getAchievements(req,res,next){try{
    const Engagement=require('../models/Engagement'); const db=require('../config/database'); const history=await ReadingHistory.getByUserId(req.user.id);
    const ratings=db.isPgConnected()? (await db.query('SELECT COUNT(*)::int AS count FROM ratings WHERE user_id=$1',[req.user.id])).rows[0].count : (db.fallbackStore.ratings||[]).filter(x=>x.user_id===req.user.id).length;
    const likes=db.isPgConnected()? (await db.query('SELECT COUNT(*)::int AS count FROM comic_likes WHERE user_id=$1',[req.user.id])).rows[0].count : (db.fallbackStore.comic_likes||[]).filter(x=>x.user_id===req.user.id).length;
    const favorites=db.isPgConnected()? (await db.query('SELECT COUNT(*)::int AS count FROM favorites WHERE user_id=$1',[req.user.id])).rows[0].count : (db.fallbackStore.favorites||[]).filter(x=>x.user_id===req.user.id).length;
    const comicsRead=new Set(history.map(x=>x.comicId)).size; const chaptersRead=history.length;
    const days=new Set(history.map(x=>new Date(x.updated_at||x.updatedAt||x.created_at||Date.now()).toISOString().slice(0,10))).size;
    const achievements=[
      {id:'first_read',name:'First Read',icon:'fa-book-open',unlocked:chaptersRead>=1},
      {id:'ten_chapters',name:'10 Chapters Read',icon:'fa-layer-group',unlocked:chaptersRead>=10},
      {id:'fifty_chapters',name:'50 Chapters Read',icon:'fa-book',unlocked:chaptersRead>=50},
      {id:'ten_comics',name:'10 Comics Read',icon:'fa-compass',unlocked:comicsRead>=10},
      {id:'first_rating',name:'First Rating',icon:'fa-star',unlocked:ratings>=1},
      {id:'ten_ratings',name:'10 Ratings',icon:'fa-ranking-star',unlocked:ratings>=10},
      {id:'twentyfive_favorites',name:'25 Favorites',icon:'fa-heart',unlocked:favorites>=25},
      {id:'twentyfive_likes',name:'25 Likes',icon:'fa-thumbs-up',unlocked:likes>=25},
      {id:'reading_streak',name:'5 Active Reading Days',icon:'fa-fire',unlocked:days>=5},
      {id:'creator_start',name:'Comic Writer',icon:'fa-pen-nib',unlocked:req.user.role==='creator'||req.user.role==='admin'}
    ];
    res.json({achievements,summary:{chaptersRead,comicsRead,ratings,likes,favorites,activeReadingDays:days}});
  }catch(e){next(e)}}

}

module.exports = UserController;
