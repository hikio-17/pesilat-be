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

  (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      throw new InvariantError(errors.array()[0].msg);
    }
    next();
  },
];
