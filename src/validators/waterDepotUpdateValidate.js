/* eslint-disable import/no-extraneous-dependencies */
const { body, validationResult } = require('express-validator');
const InvariantError = require('../exeptions/InvariantError');

exports.validateWaterDepotUpdateData = [
  body('nama')
    .isString()
    .withMessage('Nama Water Depot harus berupa string'),
  body('tanggalpasang')
    .isString()
    .withMessage('Tanggal Pasang harus berupa string'),
  body('lokasi')
    .isString()
    .withMessage('lokasi harus berupa string'),
  body('keterangan')
    .isString()
    .withMessage('Keterangan Water Depot harus berupa string'),
  body('latitude')
    .isString()
    .withMessage('Latitude Water Depot harus berupa string'),
  body('longitude')
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
