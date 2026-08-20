function notFound(req, res) {
  res.status(404).json({ error: `Route ${req.originalUrl} tidak ditemukan` });
}

function errorHandler(err, req, res, next) {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Terjadi kesalahan pada server' });
}

module.exports = { notFound, errorHandler };
