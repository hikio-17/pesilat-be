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



  let users;

  if (req.user.role === 0) {
    users = await database('users');
  }

  if (req.user.role === 1) {
    users = await database('users').where({ depotId: req.user.depotId });
  }

  if (req.user.role === 2) {
    users = await database('users').where({ id: req.user.userId });
  }

  if (!users) {
    throw new NotFoundError(`User tidak ditemukan`);
  }

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
  console.log(req.body);
  const checkAvailabiltyUser = await database('users').where({ ktp: req.body.ktp }).first();

  if (checkAvailabiltyUser) {
    throw new InvariantError(`NIK: ${req.body.ktp} sudah terdaftar`);
  }

  const checkAvailabiltyPhone = await database('users').where({ phone: req.body.phone }).first();

  if (checkAvailabiltyPhone) {
    throw new InvariantError(`Telepon: ${req.body.phone} sudah terdaftar`);
  }

  const hashedPassword = await bcrypt.hash(req.body.password, 10);

  let imageFileName;

  if (req.files) {
    const file = req.files.image;
    const fileSize = file.data.length;
    const ext = path.extname(file.name);
    const fileName = `${Date.now()}${ext}`;
    imageFileName = `${req.protocol}://${req.get("host")}/${fileName}`;
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

  const user = await database('users').insert({
    ...userData,
    depotId: req.body.depotId,
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

  const existingUser = await database('users').where({ id }).first();

  if (!existingUser) {
    throw new NotFoundError('User tidak ditemukan');
  }

  let username;

  if (req.body.username) {
    username = req.body.username;
  } else {
    username = existingUser.username;
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

  formData.set('username', username);
  formData.set('password', hashedPassword);
  formData.set('fullName', fullName);
  formData.set('phone', phone);
  formData.set('email', email);
  formData.set('alamat', alamat);
  formData.set('ktp', ktp);
  formData.set('picUrl', imageFileName);
  formData.set('role', role);
  formData.set('id', id);

  const userData = await updateUserById(formData, id);

  await database('users').where({ id }).update({
    ...userData,
    depotId: req.body.depotId,
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
