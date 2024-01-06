const express = require('express');
const asyncHandler = require('express-async-handler');
const ClientError = require('../exeptions/ClientError');
const NotFoundError = require('../exeptions/NotFoundError');
const AuthorizationError = require('../exeptions/AuthorizationError');
const { database } = require('../database');
const { superAdmin, authCheck } = require('../middlewares/auth');

const router = express.Router();

router.get('/sensor/data', authCheck, asyncHandler(async (req, res) => {

    let sensordata;

    if (req.user.role === 0) {
        sensordata = await database('sensordatas');
    }

    if (req.user.role === 1) {
        sensordata = await database('sensordatas').where({ waterDepotId: req.user.depotId });
    }

    if (!sensordata) {
        throw new NotFoundError(`Data tidak ditemukan`);
    }

    res.status(200).json({
        status: 'success',
        data: {
            sensordata,
        },
    });
}));


router.get('/sensor/data/latest-average', authCheck, superAdmin, asyncHandler(async (req, res) => {

    const latestDateResult = await database('sensordatas')
        .max('tanggal as latest_date');

    const latestDate = latestDateResult[0].latest_date;

    const sensorDataLatest = await database('sensordatas')
        .where({ tanggal: latestDate })
        .select(
            database.raw('AVG(temperature) as avg_temperature'),
            database.raw('AVG(tds) as avg_tds'),
            database.raw('AVG("do") as avg_do'),
            database.raw('AVG(ph) as avg_ph'),
            database.raw('AVG(pressure) as avg_pressure'),
            database.raw('AVG("waterLevel") as avg_waterLevel')
        );

    if (!sensorDataLatest || sensorDataLatest.length === 0) {
        throw new NotFoundError(`Data tidak ditemukan`);
    }

    res.status(200).json({
        status: 'success',
        data: {
            sensorDataLatest,
        },
    });
}));


router.post('/sensor/data', asyncHandler(async (req, res) => {

    const {
        id,
        tanggal,
        temperature,
        tds,
        di,
        ph,
        pressure,
        waterLevel,
        deviceId,
        waterDepotId
    } = req.body;

    const [year, month, day] = tanggal.split('/');
    const date = new Date(`${year}-${month}-${day}`);
    const isoString = date.toISOString();

    const sensordata = await database('sensordatas').insert({
        id,
        tanggal: isoString,
        temperature,
        tds,
        do: di,
        ph,
        pressure,
        waterLevel,
        deviceId,
        waterDepotId
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
