/* eslint-disable import/no-extraneous-dependencies */
const { body, validationResult } = require('express-validator');
const InvariantError = require('../exeptions/InvariantError');

exports.validateUserRegister = [
  body('fullName')
    .notEmpty().withMessage('Nama lengkap tidak boleh kosong.')
    .isString()
    .withMessage('Nama lengkap harus berupa string'),
  body('ktp')
    .notEmpty().withMessage('NIK tidak boleh kosong.')
    .isString()
    .withMessage('NIK harus berupa string'),
  body('password')
    .notEmpty().withMessage('Passwrod tidak boleh kosong.')
    .isString()
    .withMessage('Password harus berupa string')
    .isLength({ min: 6 })
    .withMessage('Password harus lebih dari 5 karakter'),
<<<<<<< HEAD
=======
  body('email')
    .notEmpty().withMessage('Email tidak boleh kosong')
    .isEmail()
    .withMessage('Email yan ganda masukkan tidak valid'),
  body('phone')
    .notEmpty().withMessage('Nomor HP tidak boleh kosong')
    .isString()
    .isLength({ min: 9 })
    .withMessage('Nomor HP harus lebih dari 6 karakter'),
    body('ktp')
    .notEmpty().withMessage('NIK tidak boleh kosong')
    .isString()
    .isLength(16)
    .withMessage('NIK harus 16 karakter'),

>>>>>>> f1173cece785fad1e45f1cb080c1d7a75558b8d6

  (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      throw new InvariantError(errors.array()[0].msg);
    }
    next();
  },
];
