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
    // Get AccessToken from API IOT
    // const responseAccessToken = await fetch(`${process.env.BASE_URL}/UserApi/authenticate`, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     apiKey: '123qweasd',
    //   }),
    // });

    // const responseAccessTokenJson = await responseAccessToken.json();

    // const { token } = responseAccessTokenJson;

    // // create from data
    // const formData = new FormData();
    // for (const [key, value] of Object.entries(req.body)) {
    //   formData.set(key, value);
    // }

    // // Insert Data user in API IOT
    // const response = await fetch(`${process.env.BASE_URL}/api/UserProfile/InsertData`, {
    //   method: 'POST',
    //   headers: {
    //     Authorization: `Bearer ${token}`,
    //   },
    //   body: formData,
    // });
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user = await database('users').insert({
      role: 2,
      ...req.body,
      password: hashedPassword,
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
