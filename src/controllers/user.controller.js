const express = require('express');
const asyncHandler = require('express-async-handler');
const { knex } = require('../knex');

const router = express.Router();

router.get('/users', asyncHandler(async (req, res) => {
  const users = await knex('users');

  res.status(200).json({
    status: 'success',
    data: {
      users,
    },
  });
}));

module.exports = router;
