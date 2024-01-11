/* eslint-disable import/no-extraneous-dependencies */
const { body, validationResult } = require('express-validator');
const InvariantError = require('../exeptions/InvariantError');

exports.validateWaterPriceData = [
    body('Periode')
        .notEmpty().withMessage('Periode tidak boleh kosong.')
        .isString()
        .withMessage('Periode harus berupa string'),
    body('TanggalAwal')
        .notEmpty().withMessage('Tanggal Awal tidak boleh kosong.')
        .isString()
        .withMessage('Tanggal Awal harus berupa string'),
    body('TanggalAkhir')
        .notEmpty().withMessage('Tanggal Akhir tidak boleh kosong.')
        .isString()
        .withMessage('Tanggal Akhir harus berupa string'),
    body('PricePerLiter')
        .notEmpty().withMessage('Harga air tidak boleh kosong.')
        .isInt()
        .withMessage('Harga air harus berupa number'),

    (req, res, next) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            throw new InvariantError(errors.array()[0].msg);
        }
        next();
    },
];