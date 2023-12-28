/* eslint-disable import/no-extraneous-dependencies */
const { body, validationResult } = require('express-validator');
const InvariantError = require('../exeptions/InvariantError');

exports.validateUserRegister = [
  body('fullname')
    .notEmpty().withMessage('Nama lengkap tidak boleh kosong.')
    .isString()
    .withMessage('Nama lengkap harus berupa string'),
  body('alamat')
    .notEmpty().withMessage('Alamat tidak boleh kosong.')
    .isString()
    .withMessage('Alamat harus berupa string'),
  body('password')
    .notEmpty().withMessage('Passwrod tidak boleh kosong.')
    .isString()
    .withMessage('Password harus berupa string')
    .isLength({ min: 6 })
    .withMessage('Password harus lebih dari 5 karakter'),
  body('email')
    .notEmpty().withMessage('Email tidak boleh kosong')
    .isEmail()
    .withMessage('Email yan ganda masukkan tidak valid'),
  body('phone')
    .notEmpty().withMessage('Nomor HP tidak boleh kosong')
    .isString()
    .isLength({ min: 9 })
    .withMessage('Nomor HP harus lebih dari 6 karakter'),

  (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      throw new InvariantError(errors.array()[0].msg);
    }
    next();
  },
];
