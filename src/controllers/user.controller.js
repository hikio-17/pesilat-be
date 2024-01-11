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

  // const body = {
  //   ...req.body,
  //   password: hashedPassword,
  //   picUrl: completeImageUrl,
  // }
  // const response = await fetch(`${process.env.BASE_URL}/api/UserProfile/InsertData`, {
  //   method: 'POST',
  //   headers: {
  //     Authorization: `Bearer ${token}`,
  //   },
  //   body: JSON.stringify(body),
  // });

  const user = await database('users').insert({
    ...req.body,
    password: hashedPassword,
    picUrl: imageFileName,
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

  let fileName;
  if (req.files === null) {
    imageFileName = existingUser.picUrl;
  } else {
    const file = req.files.image;
    const fileSize = file.data.length;
    const ext = path.extname(file.name);
    fileName = `${Date.now()}${ext}`;
    const allowedType = [".png", ".jpg", ".jpeg"];

    if (!allowedType.includes(ext.toLowerCase()))
      return res.status(422).json({ msg: "Format gambar yang di izinkan .png .jpg .jpeg" });
    if (fileSize > 5000000)
      return res.status(422).json({ msg: "Ukuran gambar tidak lebih dari 5 MB" });

    if (existingUser.picUrl) {
      const fileNameImage = existingUser.picUrl.split('/').pop();
      const filepath = `./src/public/${fileNameImage}`;
      fs.unlinkSync(filepath);
    }

    file.mv(`./src/public/${fileName}`, (err) => {
      if (err) return res.status(500).json({ msg: err.message });
    });
  }

  const imageFileName = `${req.protocol}://${req.get("host")}/${fileName}`;

  await database('users').where({ id }).update({
    ...req.body,
    password: hashedPassword,
    picUrl: imageFileName,
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
