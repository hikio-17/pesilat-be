const express = require('express');
const asyncHandler = require('express-async-handler');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const { database } = require('../database');
const NotFoundError = require('../exeptions/NotFoundError');
const ClientError = require('../exeptions/ClientError');
const InvariantError = require('../exeptions/InvariantError');
const { authCheck } = require('../middlewares/auth');
const { getAllUsers } = require('../utils/api');
const { createUser, updateUserById } = require('../utils/api');

const router = express.Router();

router.get('/users', authCheck, asyncHandler(async (req, res) => {

  let usersData;

  if (req.user.role === 0) {
    usersData = await database('users');
  }

  if (req.user.role === 1) {
    usersData = await database('users').where({ depotId: req.user.depotId });
  }

  if (req.user.role === 2) {
    usersData = await database('users').where({ id: req.user.userId });
  }

  if (!usersData) {
    throw new NotFoundError(`User tidak ditemukan`);
  }

  const users = usersData.map(user => ({
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    phone: user.phone,
    email: user.email,
    alamat: user.alamat,
    ktp: user.ktp,
    picUrl: user.picUrl,
    aktif: user.aktif,
    role: user.role,
    waterUsages: user.waterUsages,
    updatedDate: user.updatedDate,
    syncDate: user.syncDate
  }));

  res.status(200).json({
    status: 'success',
    data: {
      users,
    },
  });
}));

router.get('/users/:id', authCheck, asyncHandler(async (req, res) => {
  const { id } = req.params;

  let userData;

  if (req.user.role === 0) {
    userData = await database('users').where({ id }).first();
  }

  if (req.user.role === 1) {
    userData = await database('users').where({ id }).first();
  }

  if (req.user.role === 2) {
    userData = await database('users').where({ id }).first();
  }


  if (!userData) {
    throw new NotFoundError('User tidak ditemukan');
  }

  const user = {
    id: userData.id,
    username: userData.username,
    fullName: userData.fullName,
    phone: userData.phone,
    email: userData.email,
    alamat: userData.alamat,
    ktp: userData.ktp,
    picUrl: userData.picUrl,
    aktif: userData.aktif,
    role: userData.role,
    waterUsages: userData.waterUsages,
    updatedDate: userData.updatedDate,
    syncDate: userData.syncDate
  };

  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
}));

router.post('/users', authCheck, asyncHandler(async (req, res) => {

  const checkAvailabiltyUser = await database('users').where({ ktp: req.body.ktp }).first();

  if (checkAvailabiltyUser) {
    throw new InvariantError(`NIK: ${req.body.ktp} sudah terdaftar`);
  }

  const checkAvailabiltyPhone = await database('users').where({ phone: req.body.phone }).first();

  if (checkAvailabiltyPhone) {
    throw new InvariantError(`Telepon: ${req.body.phone} sudah terdaftar`);
  }

  const checkAvailabiltyUserName = await database('users').where({ phone: req.body.username }).first();

  if (checkAvailabiltyUserName) {
    throw new InvariantError(`Telepon: ${req.body.username} sudah terdaftar`);
  }

  const checkAvailabiltyEmail = await database('users').where({ phone: req.body.email }).first();

  if (checkAvailabiltyEmail) {
    throw new InvariantError(`Telepon: ${req.body.email} sudah terdaftar`);
  }

  const hashedPassword = await bcrypt.hash(req.body.password, 10);

  let imageFileName;

  if (req.files) {
    const file = req.files.image;
    const fileSize = file.data.length;
    const ext = path.extname(file.name);
    const fileName = `${Date.now()}${ext}`;
    imageFileName = `https://api-pesilat.koyeb.api/${fileName}`;
    const allowedType = [".png", ".jpg", ".jpeg"];

    if (!allowedType.includes(ext.toLowerCase()))
      return res.status(422).json({ msg: "Format gambar yang di izinkan .png .jpg .jpeg" });
    if (fileSize > 5000000)
      return res.status(422).json({ msg: "Ukuran gambar tidak lebih dari 5 MB" });

    file.mv(`./src/public/${fileName}`, (err) => {
      if (err) return res.status(500).json({ msg: err.message });
    });
  }

  const formData = new FormData();
  for (const [key, value] of Object.entries(req.body)) {
    formData.set(key, value);
  }

  formData.set('password', hashedPassword);
  formData.set('picUrl', imageFileName);

  const userData = await createUser(formData);

  const userDataResponse = await database('users').insert({
    ...userData,
    depotId: req.body.depotId,
  }).returning('*');

  if (!userDataResponse) {
    throw new ClientError('Terjadi kesalahan dalam memasukan data');
  }

  const user = {
    id: userDataResponse.id,
    username: userDataResponse.username,
    fullName: userDataResponse.fullName,
    phone: userDataResponse.phone,
    email: userDataResponse.email,
    alamat: userDataResponse.alamat,
    ktp: userDataResponse.ktp,
    picUrl: userDataResponse.picUrl,
    aktif: userDataResponse.aktif,
    role: userDataResponse.role,
    waterUsages: userDataResponse.waterUsages,
    updatedDate: userDataResponse.updatedDate,
    syncDate: userDataResponse.syncDate
  };

  res.status(200).json({
    status: 'success',
    data: {
      user
    },
  });
}));

router.put('/users/:id', authCheck, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existingUser = await database('users').where({ id }).first();

  if (!existingUser) {
    throw new NotFoundError('User tidak ditemukan');
  }

  let username;

  if (req.body.username) {
    username = req.body.username;
  } else {
    if (existingUser.username === null) {
      username = "undefined"
    } else {
      username = existingUser.username;
    }
  }

  let hashedPassword;
  if (req.body.password) {
    try {
      hashedPassword = await bcrypt.hash(req.body.password, 10);
    } catch (error) {
      console.error('Error hashing password:', error);
      throw new Error('Terjadi kesalahan dalam menghash kata sandi');
    }
  } else {
    hashedPassword = existingUser.password;
  }

  let fullName;

  if (req.body.fullName) {
    fullName = req.body.fullName;
  } else {
    fullName = existingUser.fullName;
  }

  let phone;

  if (req.body.phone) {
    phone = req.body.phone;
  } else {
    phone = existingUser.phone;
  }

  let email;

  if (req.body.email) {
    email = req.body.email;
  } else {
    email = existingUser.email;
  }

  let alamat;

  if (req.body.alamat) {
    alamat = req.body.alamat;
  } else {
    alamat = existingUser.alamat;
  }

  let ktp;

  if (req.body.ktp) {
    ktp = req.body.ktp;
  } else {
    ktp = existingUser.ktp;
  }

  let role;

  if (req.body.role) {
    role = req.body.role;
  } else {
    role = existingUser.role;
  }

  let pin;

  if (req.body.pin) {
    pin = req.body.pin;
  } else {
    pin = existingUser.pin;
  }

  let imageFileName;

  if (!req.files || !req.files.image) {
    if (existingUser.picUrl) {
      imageFileName = existingUser.picUrl;
    } else {
      imageFileName = "undefined";
    }
  } else {
    const file = req.files.image;
    const fileSize = file.data.length;
    const ext = path.extname(file.name);
    const fileName = `${Date.now()}${ext}`;
    const allowedType = [".png", ".jpg", ".jpeg"];

    if (!allowedType.includes(ext.toLowerCase())) {
      return res.status(422).json({ msg: "Format gambar yang diizinkan: .png, .jpg, .jpeg" });
    }

    if (fileSize > 5000000) {
      return res.status(422).json({ msg: "Ukuran gambar tidak boleh lebih dari 5 MB" });
    }

    if (existingUser.picUrl !== "undefined") {
      const fileNameImage = existingUser.picUrl.split('/').pop();
      const filepath = `./src/public/${fileNameImage}`;

      try {
        fs.unlinkSync(filepath);
      } catch (err) {
        console.error('Error deleting existing image:', err);
      }
    }

    if (imageFileName !== "undefined") {
      file.mv(`./src/public/${fileName}`, (err) => {
        if (err) return res.status(500).json({ msg: err.message });
      });
    }

    imageFileName = `${req.protocol}://${req.get("host")}/${fileName}`;
  }

  const formData = new FormData();
  for (const [key, value] of Object.entries(req.body)) {
    formData.set(key, value);
  }

  formData.set('username', username);
  formData.set('password', hashedPassword);
  formData.set('fullName', fullName);
  formData.set('phone', phone);
  formData.set('email', email);
  formData.set('alamat', alamat);
  formData.set('ktp', ktp);
  formData.set('picUrl', imageFileName);
  formData.set('pin', pin);
  formData.set('role', role);
  formData.set('id', id);

  const userData = await updateUserById(formData, id);

  await database('users').where({ id }).update({
    ...userData,
    depotId: req.body.depotId,
  });

  const updatedUser = await database('users').where({ id }).first();

  const user = {
    id: updatedUser.id,
    username: updatedUser.username,
    fullName: updatedUser.fullName,
    phone: updatedUser.phone,
    email: updatedUser.email,
    alamat: updatedUser.alamat,
    ktp: updatedUser.ktp,
    picUrl: updatedUser.picUrl,
    aktif: updatedUser.aktif,
    role: updatedUser.role,
    waterUsages: updatedUser.waterUsages,
    updatedDate: updatedUser.updatedDate,
    syncDate: updatedUser.syncDate
  };

  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
}));


router.delete('/users/:id', authCheck, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await database('users').where({ id }).first();

  if (!user) {
    throw new NotFoundError('User tidak ditemukan');
  }

  if (user.picUrl) {
    const fileName = user.picUrl.split('/').pop();
    fs.unlink(`src/public/${fileName}`, (err) => {
      if (err) {
        console.error('Gagal menghapus foto lama:', err);
      } else {
        console.log('Foto lama berhasil dihapus');
      }
    });
  }


  // await axios.post('https://waterpositive.my.id/api/UserProfile/DeleteData', { id });

  await database('users').where({ id }).del();

  res.status(200).json({
    status: 'success',
    message: 'User deleted successfully',
  });
}));

module.exports = router;
