const express = require('express');
const asyncHandler = require('express-async-handler');
const NotFoundError = require('../exeptions/NotFoundError');
const ClientError = require('../exeptions/ClientError');
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
    name, nik, address, phone,
  } = req.body;

  const newUser = await database('users').insert({
    name,
    nik,
    address,
    phone,
  });

  if (!newUser) {
    throw new ClientError('Terjadi kesalahan dalam memasukan data');
  }

  const createdUser = await database('users').where({ id: newUser[0] }).first();

  res.status(200).json({
    status: 'success',
    data: {
      user: createdUser,
    },
  });
}));

router.patch('/users/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    username, alamat, password, phone, email,  ktp, picUrl
  } = req.body;

  const existingUser = await database('users').where({ id }).first();

  if (!existingUser) {
    throw new NotFoundError('User tidak ditemukan');
  }

  const dataToSend = {
    id,
    username,
    alamat,
    password,
    phone,
    email,
    ktp,
    picUrl,
  };

  await axios.post('https://waterpositive.my.id/api/UserProfile/UpdateData', dataToSend);

  await database('users').where({ id }).update({
    username,
    password,
    phone,
    email,
    alamat,
    ktp,
    picUrl,
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

  await axios.post('https://waterpositive.my.id/api/UserProfile/DeleteData', { id });

  await database('users').where({ id }).del();

  res.status(200).json({
    status: 'success',
    message: 'User deleted successfully',
  });
}));

module.exports = router;
