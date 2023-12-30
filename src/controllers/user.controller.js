const express = require('express');
const asyncHandler = require('express-async-handler');
const NotFoundError = require('../exeptions/NotFoundError');
const ClientError = require('../exeptions/ClientError');
const { database } = require('../database');
const bcrypt = require('bcrypt');
const { adminDepot, superAdmin, authCheck } = require('../middlewares/auth');
const InvariantError = require('../exeptions/InvariantError');

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

router.get('/users/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await database('users').where({ id }).first();

  if (!user) {
    throw new NotFoundError('User tidak ditemukan');
  }

  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
}));

router.post('/users', asyncHandler(async (req, res) => {

  const {
    fullName,
    alamat,
    password,
    phone,
    ktp,
    role
  } = req.body;

  const checkAvailabiltyUser = await database('users').where({ ktp }).first();

  if (checkAvailabiltyUser) {
    throw new InvariantError(`NIK: ${ktp} sudah terdaftar`);
  }

  const checkAvailabiltyPhone = await database('users').where({ phone }).first();

  if (checkAvailabiltyPhone) {
    throw new InvariantError(`Telepon: ${phone} sudah terdaftar`);
  }
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await database('users').insert({
    fullName,
    alamat,
    password: hashedPassword,
    phone,
    ktp,
    role
  }).returning('*');

  if (!user) {
    throw new ClientError('Terjadi kesalahan dalam memasukan data');
  }

  res.status(200).json({
    status: 'success',
    data: {
      user
    },
  });
}));

router.put('/users/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    fullName,
    alamat,
    password,
    phone,
    ktp,
    role
  } = req.body;

  const existingUser = await database('users').where({ id }).first();

  if (!existingUser) {
    throw new NotFoundError('User tidak ditemukan');
  }

  // const responseAccessToken = await axios.post(`${process.env.BASE_URL}/UserApi/authenticate`, {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json',
  //   },
  //   body: JSON.stringify({
  //     apiKey: '123qweasd',
  //   }),
  // });

  // const responseAccessTokenJson = await responseAccessToken.json();

  //   const { token } = responseAccessTokenJson;

  // const dataToSend = {
  //   id,
  //   fullName,
  //   alamat,
  //   password,
  //   email,
  //   phone,
  //   ktp
  // };

  // await axios.post('https://waterpositive.my.id/api/UserProfile/UpdateData', {
  //   method: 'POST',
  //   headers: {
  //     Authorization: `Bearer ${token}`,
  //   },
  //   body: dataToSend,
  // });
  const hashedPassword = await bcrypt.hash(password, 10);

  await database('users').where({ id }).update({
    fullName,
    alamat,
    password: hashedPassword,
    phone,
    ktp,
    role
  });

  const updatedUser = await database('users').where({ id }).first();

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
}));

router.delete('/users/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await database('users').where({ id }).first();

  if (!user) {
    throw new NotFoundError('User tidak ditemukan');
  }

  // await axios.post('https://waterpositive.my.id/api/UserProfile/DeleteData', { id });

  await database('users').where({ id }).del();

  res.status(200).json({
    status: 'success',
    message: 'User deleted successfully',
  });
}));

module.exports = router;
