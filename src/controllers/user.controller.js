const express = require('express');
const asyncHandler = require('express-async-handler');
const { database } = require('../database');
const { adminDepot, superAdmin, authCheck } = require('../middlewares/auth');

const router = express.Router();

router.get('/users', authCheck, adminDepot, superAdmin, asyncHandler(async (req, res) => {
  const users = await database('users');

  res.status(200).json({
    status: 'success',
    data: {
      users,
    },
  });
}));

module.exports = router;
