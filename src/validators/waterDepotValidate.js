/* eslint-disable import/no-extraneous-dependencies */
const { body, validationResult } = require('express-validator');
const InvariantError = require('../exeptions/InvariantError');

exports.validateWaterDepotData = [
  body('nama')
    .notEmpty().withMessage('Nama Water Depot tidak boleh kosong.')
    .isString()
    .withMessage('Nama Water Depot harus berupa string'),
  body('tanggalPasang')
    .notEmpty().withMessage('Tanggal Pasang tidak boleh kosong.')
    .isString()
    .withMessage('Tanggal Pasang harus berupa string'),
  body('lokasi')
    .notEmpty().withMessage('lokasi tidak boleh kosong.')
    .isString()
    .withMessage('lokasi harus berupa string'),
  body('keterangan')
    .notEmpty().withMessage('Keterangan Water Depot tidak boleh kosong.')
    .isString()
    .withMessage('Keterangan Water Depot harus berupa string'),
  body('latitude')
    .notEmpty().withMessage('Latitude Water Depot tidak boleh kosong.')
    .isString()
    .withMessage('Latitude Water Depot harus berupa string'),
  body('longitude')
    .notEmpty().withMessage('Longitude Water Depot tidak boleh kosong.')
    .isString()
    .withMessage('Longitude Water Depot harus berupa string'),

  (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      throw new InvariantError(errors.array()[0].msg);
    }
    next();
  },
];
