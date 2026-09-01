function notFound(req, res, next) {
  res.status(404);
  next(new Error(`API Route Not Found: ${req.originalUrl}`));
}

function errorHandler(err, _req, res, _next) {
  const status = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Server error',
  });
}

module.exports = { notFound, errorHandler };
