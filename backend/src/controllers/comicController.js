const Comic = require('../models/Comic');
const Chapter = require('../models/Chapter');
const Bookmark = require('../models/Bookmark');
const Favorite = require('../models/Favorite');
const Genre = require('../models/Genre');
const NotificationService = require('../services/notificationService');
const User = require('../models/User');
const FeatureService = require('../services/featureService');

class ComicController {
  static async getComics(req, res, next) {
    try {
      const { search, genre, status, type, language, sortBy, limit, offset } = req.query;
      const comics = await Comic.getAll({
        search,
        genre,
        status,
        type,
        language,
        sortBy,
        limit: limit ? parseInt(limit, 10) : 24,
        offset: offset ? parseInt(offset, 10) : 0,
        creatorId: req.query.mine && req.user ? req.user.id : null,
        includeDrafts: !!(req.user && (req.user.role === 'admin' || req.query.mine))
      });
      res.status(200).json({ comics, count: comics.length });
    } catch (err) {
      next(err);
    }
  }

  static async getComicById(req, res, next) {
    try {
      const comic = await Comic.findById(req.params.id);
      if (!comic) {
        return res.status(404).json({ error: 'Comic not found.' });
      }

      let isBookmarked = false;
      let isFavorite = false;

      if (req.user) {
        isBookmarked = await Bookmark.isBookmarked(req.user.id, comic.id);
        isFavorite = await Favorite.isFavorite(req.user.id, comic.id);
      }

      const canSeeUnpublished = !!(req.user && (req.user.role === 'admin' || (comic.creatorId && comic.creatorId === req.user.id)));
      if (comic.publishStatus !== 'published' && !canSeeUnpublished) return res.status(404).json({ error: 'Comic not found.' });
      const chapters = await Chapter.getByComicId(comic.id, { includeUnpublished: canSeeUnpublished });

      res.status(200).json({
        comic,
        chapters,
        isBookmarked,
        isFavorite
      });
    } catch (err) {
      next(err);
    }
  }

  static async getComicBySlug(req, res, next) {
    try {
      const comic = await Comic.findBySlug(req.params.slug);
      if (!comic) {
        return res.status(404).json({ error: 'Comic not found.' });
      }

      let isBookmarked = false;
      let isFavorite = false;

      if (req.user) {
        isBookmarked = await Bookmark.isBookmarked(req.user.id, comic.id);
        isFavorite = await Favorite.isFavorite(req.user.id, comic.id);
      }

      const canSeeUnpublished = !!(req.user && (req.user.role === 'admin' || (comic.creatorId && comic.creatorId === req.user.id)));
      if (comic.publishStatus !== 'published' && !canSeeUnpublished) return res.status(404).json({ error: 'Comic not found.' });
      const chapters = await Chapter.getByComicId(comic.id, { includeUnpublished: canSeeUnpublished });

      res.status(200).json({
        comic,
        chapters,
        isBookmarked,
        isFavorite
      });
    } catch (err) {
      next(err);
    }
  }

  static async recordView(req, res, next) {
    try {
      const comic = await Comic.findById(req.params.id);
      if (!comic) {
        return res.status(404).json({ error: 'Comic not found.' });
      }

      await Comic.incrementViews(comic.id);
      FeatureService.analytics({userId:req.user?.id||null,eventType:'comic_view',path:req.originalUrl,comicId:comic.id,ip:req.ip}).catch(()=>{});
      const updatedComic = await Comic.findById(comic.id);

      res.status(200).json({
        views: updatedComic ? Number(updatedComic.views || 0) : Number(comic.views || 0) + 1
      });
    } catch (err) {
      next(err);
    }
  }

  static async suggestions(req,res,next){try{const q=String(req.query.q||'').trim();if(q.length<2)return res.json({suggestions:[]});const comics=await Comic.getAll({search:q,limit:8,sortBy:'trending'});res.json({suggestions:comics.map(c=>({id:c.id,title:c.title,slug:c.slug,coverImage:c.coverImage}))});}catch(e){next(e)}}

  static async getGenres(req, res, next) {
    try {
      const genres = await Genre.getAll();
      res.status(200).json({ genres });
    } catch (err) {
      next(err);
    }
  }

  static async createComic(req, res, next) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Login required.' });
      if (req.user.role !== 'admin' && req.user.role !== 'creator') return res.status(403).json({ error: 'Become a Comic Writer from your dashboard before uploading.' });
      if (!req.body.title || String(req.body.title).trim().length < 2) return res.status(400).json({ error: 'Comic title is required.' });
      const scheduled = req.body.scheduledPublishAt ? new Date(req.body.scheduledPublishAt) : null;
      if (scheduled && Number.isNaN(scheduled.getTime())) return res.status(400).json({error:'Invalid schedule date.'});
      let publishStatus = req.user.role === 'admin' ? (req.body.publishStatus || 'published') : (req.body.saveDraft ? 'draft' : 'pending');
      if (scheduled && req.user.role === 'admin') publishStatus = 'scheduled';
      const payload = { ...req.body, creatorId: req.user.role === 'admin' ? (req.body.creatorId || null) : req.user.id, publishStatus, scheduledPublishAt: scheduled ? scheduled.toISOString() : null };
      const comic = await Comic.create(payload);
      await FeatureService.audit({actorId:req.user.id,action:'comic_created',targetType:'comic',targetId:comic.id,metadata:{publishStatus},ip:req.ip}).catch(()=>{});
      res.status(201).json({ comic, message: publishStatus==='scheduled' ? 'Comic scheduled successfully.' : 'Comic created successfully.' });
    } catch (err) {
      next(err);
    }
  }



  static async scheduleComic(req,res,next){
    try{
      if(req.user.role!=='admin') return res.status(403).json({error:'Only an administrator can schedule publication.'});
      const when=new Date(req.body.scheduledPublishAt);
      if(Number.isNaN(when.getTime()) || when.getTime()<=Date.now()) return res.status(400).json({error:'Choose a future publication date and time.'});
      const comic=await Comic.findById(req.params.id);
      if(!comic)return res.status(404).json({error:'Comic not found.'});
      const updated=await Comic.update(req.params.id,{publishStatus:'scheduled',scheduledPublishAt:when.toISOString(),reviewNote:null});
      await FeatureService.audit({actorId:req.user.id,action:'comic_scheduled',targetType:'comic',targetId:req.params.id,metadata:{scheduledPublishAt:when.toISOString()},ip:req.ip}).catch(()=>{});
      res.json({comic:updated,message:'Comic scheduled successfully.'});
    }catch(e){next(e)}
  }

  static async publishComic(req, res, next) {
    try {
      if (req.user.role !== 'admin') return res.status(403).json({ error: 'Only an administrator can publish submissions.' });
      const comic = await Comic.findById(req.params.id);
      if (!comic) return res.status(404).json({ error: 'Comic not found.' });
      const updated = await Comic.update(req.params.id, { publishStatus: 'published', reviewNote: null, scheduledPublishAt:null });
      NotificationService.broadcastNewComic(updated, User).catch(()=>{});
      if (updated.creatorId) NotificationService.create(updated.creatorId,'comic_approved','Comic approved',`${updated.title} was approved and published.`,{comicId:updated.id}).catch(()=>{});
      res.json({ comic: updated, message: 'Comic approved and published.' });
    } catch (err) { next(err); }
  }

  static async requestChanges(req,res,next){
    try{
      const comic=await Comic.findById(req.params.id);
      if(!comic)return res.status(404).json({error:'Comic not found.'});
      const note=String(req.body.reason||'Please update this submission and resubmit.').trim();
      const updated=await Comic.update(req.params.id,{publishStatus:'changes_requested',reviewNote:note});
      if(updated.creatorId) NotificationService.create(updated.creatorId,'changes_requested','Changes requested',note,{comicId:updated.id}).catch(()=>{});
      res.json({comic:updated,message:'Changes requested from creator.'});
    }catch(e){next(e)}
  }

  static async rejectComic(req, res, next) {
    try {
      if (req.user.role !== 'admin') return res.status(403).json({ error: 'Only an administrator can reject submissions.' });
      const comic = await Comic.findById(req.params.id);
      if (!comic) return res.status(404).json({ error: 'Comic not found.' });
      const updated = await Comic.update(req.params.id, { publishStatus: 'rejected', reviewNote: req.body.reason || 'Rejected by administrator.' });
      res.json({ comic: updated, message: 'Comic rejected.' });
    } catch (err) { next(err); }
  }

  static async resubmitComic(req, res, next) {
    try {
      const comic = await Comic.findById(req.params.id);
      if (!comic) return res.status(404).json({ error: 'Comic not found.' });
      if (req.user.role !== 'admin' && comic.creatorId !== req.user.id) return res.status(403).json({ error: 'You can only resubmit your own comics.' });
      const updated = await Comic.update(req.params.id, { publishStatus: req.body.saveDraft?'draft':'pending', reviewNote: null });
      res.json({ comic: updated, message: 'Comic resubmitted for administrator review.' });
    } catch (err) { next(err); }
  }

  static async updateComic(req, res, next) {
    try {
      const existing = await Comic.findById(req.params.id);
      if (!existing) return res.status(404).json({ error: 'Comic not found.' });
      if (req.user.role !== 'admin' && existing.creatorId !== req.user.id) {
        return res.status(403).json({ error: 'You can only edit your own comics.' });
      }
      const scheduled = req.body.scheduledPublishAt ? new Date(req.body.scheduledPublishAt) : null;
      if (scheduled && Number.isNaN(scheduled.getTime())) return res.status(400).json({error:'Invalid schedule date.'});
      const payload = req.user.role === 'admin' ? {...req.body, scheduledPublishAt:scheduled?scheduled.toISOString():null, publishStatus:scheduled?'scheduled':(req.body.publishStatus||existing.publishStatus)} : { ...req.body, publishStatus: (scheduled && req.user.role==='admin')?'scheduled':'pending', reviewNote: null, scheduledPublishAt: scheduled?scheduled.toISOString():null }; 
      const comic = await Comic.update(req.params.id, payload);
      await FeatureService.audit({actorId:req.user.id,action:'comic_updated',targetType:'comic',targetId:comic?.id,metadata:{publishStatus:comic?.publishStatus},ip:req.ip}).catch(()=>{});
      if (!comic) {
        return res.status(404).json({ error: 'Comic not found.' });
      }
      res.status(200).json({ comic, message: 'Comic updated successfully.' });
    } catch (err) {
      next(err);
    }
  }

  static async deleteComic(req, res, next) {
    try {
      const success = await Comic.delete(req.params.id);
      if (!success) {
        return res.status(404).json({ error: 'Comic not found.' });
      }
      res.status(200).json({ message: 'Comic deleted successfully.' });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = ComicController;
