const express = require('express');
const asyncHandler = require('express-async-handler');
const ClientError = require('../exeptions/ClientError');
const NotFoundError = require('../exeptions/NotFoundError');
const AuthorizationError = require('../exeptions/AuthorizationError');
const { database } = require('../database');
const { superAdmin, authCheck } = require('../middlewares/auth');

const router = express.Router();

router.get('/sensordata', asyncHandler(async (req, res) => {
    const sensordata = await database('sensordatas');

    res.status(200).json({
        status: 'success',
        data: {
            sensordata,
        },
    });
}));



router.post('/sensordata', asyncHandler(async (req, res) => {

    const {
        id,
        tanggal,
        temperature,
        tds,
        di,
        ph,
        pressure,
        waterLevel,
        deviceId
    } = req.body;

    const sensordata = await database('sensordatas').insert({
        id,
        tanggal,
        temperature,
        tds,
        do: di,
        ph,
        pressure,
        waterLevel,
        deviceId
    }).returning('*');

    if (!sensordata) {
        throw new ClientError('Sensor data gagal dibuat. silahkan ulangi');
    }

    res.status(200).json({
        status: 'success',
        message: 'Sensot data berhasil dibuat',
        data: {
            sensordata,
        },
    });
}));

router.delete('/sensordata/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;

    const waterDepot = await database('sensordatas').where({ id }).first();

    if (!waterDepot) {
        throw new NotFoundError(`Tidak dapat menghapus data. Water usage dengan id ${id} tidak ditemukan.`);
    }

    await database('waterusage').where({ userId: id }).del();

    res.status(200).json({
        status: 'success',
        message: `Water usage dengan id ${id} berhasil dihapus`,
    });
}));



module.exports = router;
