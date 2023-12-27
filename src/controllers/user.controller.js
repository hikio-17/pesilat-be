const express = require('express');
const asyncHandler = require('express-async-handler');
const { database } = require('../database');

const router = express.Router();

router.get('/users', asyncHandler(async (req, res) => {
  const users = await database('users');

  res.status(200).json({
    status: 'success',
    data: {
      users,
    },
  });
}));

module.exports = router;
