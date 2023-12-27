/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-unused-vars */
const express = require('express');
const asyncHandler = require('express-async-handler');
const bcrypt = require('bcrypt');
const { database } = require('../database');
const AuthenticationError = require('../exeptions/AuthenticationError');
const { createAccessToken } = require('../tokenize/tokenManager');

const router = express.Router();

router.post('/auth', asyncHandler(async (req, res) => {
  const { nik, password } = req.body;
  const user = await database('users').where({ nik }).first();

  if (!user) {
    throw new AuthenticationError('NIK anda belum terdaftar. silah daftar terlebih dahulu');
  }

  const isValidPassword = await bcrypt.compare(password, user.password);

  if (!isValidPassword) {
    throw new AuthenticationError('Kredensial yang anda berikan tidak valid');
  }

  const accessToken = await createAccessToken(user);

  res.status(200).json({
    status: 'success',
    data: {
      user,
      accessToken,
    },
  });
}));

router.post(
  '/auth/signup',
  asyncHandler(async (req, res) => {
    const id = 'aknfkdkj';
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const data = {
      id,
      ...req.body,
      password: hashedPassword,
    };
    const result = await database('users').insert(data);

    res.status(201).json({
      status: 'success',
      data: {
        result,
      },
    });
  }),
);

module.exports = router;
