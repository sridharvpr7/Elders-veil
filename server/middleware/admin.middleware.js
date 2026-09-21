function adminMiddleware(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Administrator privilege required'
    });
  }
  next();
}

module.exports = adminMiddleware;
