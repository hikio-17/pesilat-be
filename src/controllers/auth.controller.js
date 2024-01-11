/* eslint-disable no-restricted-syntax */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-unused-vars */
require('dotenv').config();
const express = require('express');
const asyncHandler = require('express-async-handler');
const bcrypt = require('bcrypt');
const { database } = require('../database');
const AuthenticationError = require('../exeptions/AuthenticationError');
const { createAccessToken } = require('../tokenize/tokenManager');
const ClientError = require('../exeptions/ClientError');
const { validateUserRegister } = require('../validators/userRegisterValidate');
const InvariantError = require('../exeptions/InvariantError');
const { createUser } = require('../utils/api');

const router = express.Router();

router.post('/auth', asyncHandler(async (req, res) => {
  const { ktp, password } = req.body;
  const user = await database('users').where({ ktp }).first();

  if (!user) {
    throw new AuthenticationError('NIK anda belum terdaftar. silahkan daftar terlebih dahulu');
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
  validateUserRegister,
  asyncHandler(async (req, res) => {
    const checkAvailabilityUser = await database('users').where({ ktp: req.body.ktp }).first();

    if (checkAvailabilityUser) {
      throw new InvariantError('NIK yang anda gunakan sudah terdaftar');
    }
    // create from data
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    const formData = new FormData();
    for (const [key, value] of Object.entries(req.body)) {
      formData.set(key, value);
    }

    formData.set('password', hashedPassword);

    const userData = await createUser(formData);

    const user = await database('users').insert({
      ...userData,
      depotId: req.body.depotId,
    }).returning('*');

    if (!user) {
      throw new ClientError('Gagal membuat akun. silahkan hubungi admin');
    }

    const accessToken = await createAccessToken(user[0]);

    res.status(201).json({
      status: 'success',
      message: 'Akun berhasil dibuat',
      data: {
        accessToken,
      },
    });
    

    // if (response.status === 200) {
    //   res.status(201).json({
    //     status: 'success',
    //     message: 'akun berhasil dibuat. silahkan login',
    //     data: {
    //       status: response.status,
    //     },
    //   });
    // } else {
    //   throw new ClientError('Akun gagal dibuat. silahkan hubungi admin');
    // }
  }),
);

module.exports = router;
