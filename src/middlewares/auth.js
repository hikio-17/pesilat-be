const asyncHandler = require('express-async-handler');
const AuthenticationError = require('../exeptions/AuthenticationError');
const { verifyAccessToken, decodePayload } = require('../tokenize/tokenManager');
const AuthorizationError = require('../exeptions/AuthorizationError');

exports.authCheck = asyncHandler(async (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) {
    throw new AuthenticationError('Akses token diperlukan');
  }
  await verifyAccessToken(token);
  const { user } = await decodePayload(token);

  if (!user) {
    throw new AuthenticationError('Token yang anda berikan tidak valid.');
  }

  req.user = {
      role: user.role,
      userId: user.id,
      depotId: user.depotId,
  };
  next();
});

exports.adminDepot = asyncHandler(async (req, res, next) => {
  if (req.user.role !== 1) {
    throw new AuthorizationError('Anda tidak berhak mengakses resource ini');
  }

  next();
});

exports.superAdmin = asyncHandler(async (req, res, next) => {
  if (req.user.role !== 0) {
    throw new AuthorizationError('Anda tidak berhak mengakses resource ini');
  }

  next();
});
