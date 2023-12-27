const ClientError = require('../exeptions/ClientError');

exports.errorHandler = (err, req, res, next) => {
  if (err instanceof ClientError) {
    res.status(err.statusCode).json({
      status: 'fail',
      message: err.message,
    });
    return;
  }
  res.status(500).send({
    status: 'error',
    message: err || 'Internal server error',
  });
  next();
};
