const express = require('express');
const asyncHandler = require('express-async-handler');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const { database } = require('../database');
const NotFoundError = require('../exeptions/NotFoundError');
const ClientError = require('../exeptions/ClientError');
const InvariantError = require('../exeptions/InvariantError');
const { authCheck } = require('../middlewares/auth');

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'src/public');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new ClientError('Hanya gambar dengan format jpg, jpeg, png, dan gif yang diizinkan!'));
    }
    cb(null, true);
  }
});

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

router.post('/users', upload.single('image'), asyncHandler(async (req, res) => {

  const checkAvailabiltyUser = await database('users').where({ ktp: req.body.ktp }).first();

  if (checkAvailabiltyUser) {
    throw new InvariantError(`NIK: ${req.body.ktp} sudah terdaftar`);
  }

  const checkAvailabiltyPhone = await database('users').where({ phone: req.body.phone }).first();

  if (checkAvailabiltyPhone) {
    throw new InvariantError(`Telepon: ${req.body.phone} sudah terdaftar`);
  }

  let imageFileName;
  
  if (req.file) {
    imageFileName = req.file.filename;
  } 

  const completeImageUrl = imageFileName ? `${req.protocol}://${req.get('host')}/${imageFileName}` : null;

  const hashedPassword = await bcrypt.hash(req.body.password, 10);

  const user = await database('users').insert({
    ...req.body,
    password: hashedPassword,
    picUrl: completeImageUrl,
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

router.put('/users/:id', upload.single('image'), asyncHandler(async (req, res) => {
  const { id } = req.params;

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

  let hashedPassword;
  if (req.body.password) {
    try {
      hashedPassword = await bcrypt.hash(req.body.password, 10);
    } catch (error) {
      throw new Error('Error hashing password');
    }
  }

  let imageFileName;

  if (existingUser.picUrl) {
    const fileName = existingUser.picUrl.split('/').pop();
    fs.unlink(`src/public/${fileName}`, (err) => {
      if (err) {
        console.error('Gagal menghapus foto lama:', err);
      } else {
        console.log('Foto lama berhasil dihapus:', fileName);
      }
    });
    imageFileName = req.file.filename;
  }

  const completeImageUrl = imageFileName ? `${req.protocol}://${req.get('host')}/${imageFileName}` : existingUser.picUrl;
  console.log(completeImageUrl);
  await database('users').where({ id }).update({
    ...req.body,
    password: hashedPassword,
    picUrl: completeImageUrl,
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
    console.log(fileName);
    fs.unlink(`src/public/${fileName}`, (err) => {
      if (err) {
        console.error('Gagal menghapus foto lama:', err);
      } else {
        console.log('Foto lama berhasil dihapus:', fileName);
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
