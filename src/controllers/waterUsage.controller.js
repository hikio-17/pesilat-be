const express = require('express');
const asyncHandler = require('express-async-handler');
const ClientError = require('../exeptions/ClientError');
const NotFoundError = require('../exeptions/NotFoundError');
const AuthorizationError = require('../exeptions/AuthorizationError');
const { database } = require('../database');
const { authCheck } = require('../middlewares/auth');
const { syncronizeWaterUsages } = require('../utils/api');

const router = express.Router();

router.get('/water/usage/daily', authCheck, asyncHandler(async (req, res) => {
    await syncronizeWaterUsages();

    let waterUsage;
    let groupedData;

    if (req.user.role === 0) {
        waterUsage = await database('waterusage');
    }

    if (req.user.role === 1) {
        waterUsage = await database('waterusage').where({ waterDepotId: req.user.depotId });
    }

    if (req.user.role === 2) {
        waterUsage = await database('waterusage').where({ userId: req.user.userId });
    }

    if (!waterUsage) {
        throw new NotFoundError(`Water Usage tidak ditemukan`);
    }

    res.status(200).json({
        status: 'success',
        data: {
            waterUsage,
        },
    });
}));

router.get('/water/usage/daily/:id', authCheck, asyncHandler(async (req, res) => {
    // syncronize data
    await syncronizeWaterUsages();

    const { id } = req.params;

    let waterUsage;

    if (req.user.role === 0) {
        const waterUsageData = await database('waterusage');
        waterUsage = waterUsageData.filter((item) => item.userId == id);
    }

    if (req.user.role === 1) {
        const waterUsageData = await database('waterusage').where({ waterDepotId: req.user.depotId });
        waterUsage = waterUsageData.filter((item) => item.userId == id);
    }

    if (req.user.role === 2) {
        throw new AuthorizationError('Anda tidak berhak mengakses resource ini');
    }

    if (!waterUsage) {
        throw new NotFoundError(`Water Usage tidak ditemukan`);
    }

    res.status(200).json({
        status: 'success',
        data: {
            waterUsage,
        },
    });
}));


router.get('/admin/water/usage/weekly', authCheck, asyncHandler(async (req, res) => {

    let dailyData;

    if (req.user.role === 0) {
        dailyData = await database('waterusage');
    }

    if (req.user.role === 1) {

        dailyData = await database('waterusage').where({ waterDepotId: req.user.depotId });
    }

    if (req.user.role === 2) {
        dailyData = await database('waterusage').where({ userId: req.user.userId });
    }

    if (!dailyData) {
        throw new NotFoundError(`Water Usage tidak ditemukan`);
    }

    function getWeekNumber(date) {
        const oneJan = new Date(date.getFullYear(), 0, 1);
        const timeDiff = date - oneJan;
        const dayOfYear = Math.ceil(timeDiff / (24 * 60 * 60 * 1000));
        return Math.ceil(dayOfYear / 7);
    }

    const weeklyData = {};
    dailyData.forEach(entry => {
        const entryDate = new Date(entry.tanggal);
        const weekNumber = getWeekNumber(entryDate);

        if (!weeklyData[weekNumber]) {
            weeklyData[weekNumber] = {
                totalVolume: 0,
                totalHarga: 0,
                month: entryDate.toLocaleString('default', { month: 'long' }),
                year: entryDate.getFullYear(),
            };
        }
        weeklyData[weekNumber].totalVolume += entry.volume;
        weeklyData[weekNumber].totalHarga += entry.totalHarga;
    });

    const responseWeeklyData = Object.keys(weeklyData).map(weekNumber => ({
        minggu: parseInt(weekNumber),
        bulan: weeklyData[weekNumber].month,
        tahun: weeklyData[weekNumber].year,
        totalVolume: weeklyData[weekNumber].totalVolume,
        totalHarga: weeklyData[weekNumber].totalHarga,
    }));


    res.status(200).json({
        status: 'success',
        data: {
            weeklyData: responseWeeklyData,
        },
    });
}));

router.get('/admin/water/usage/weekly:id', authCheck, asyncHandler(async (req, res) => {

    const { id } = req.params;

    let dailyData;

    if (req.user.role === 0) {
        const waterUsageData = await database('waterusage');
        dailyData = waterUsageData.filter((item) => item.userId == id);
    }

    if (req.user.role === 1) {
        const waterUsageData = await database('waterusage').where({ waterDepotId: req.user.depotId });
        dailyData = waterUsageData.filter((item) => item.userId == id);
    }

    if (req.user.role === 2) {
        throw new AuthorizationError('Anda tidak berhak mengakses resource ini');
    }

    if (!dailyData) {
        throw new NotFoundError(`Water Usage tidak ditemukan`);
    }

    function getWeekNumber(date) {
        const oneJan = new Date(date.getFullYear(), 0, 1);
        const timeDiff = date - oneJan;
        const dayOfYear = Math.ceil(timeDiff / (24 * 60 * 60 * 1000));
        return Math.ceil(dayOfYear / 7);
    }

    const weeklyData = {};
    dailyData.forEach(entry => {
        const entryDate = new Date(entry.tanggal);
        const weekNumber = getWeekNumber(entryDate);

        if (!weeklyData[weekNumber]) {
            weeklyData[weekNumber] = {
                totalVolume: 0,
                totalHarga: 0,
                month: entryDate.toLocaleString('default', { month: 'long' }),
                year: entryDate.getFullYear(),
            };
        }
        weeklyData[weekNumber].totalVolume += entry.volume;
        weeklyData[weekNumber].totalHarga += entry.totalHarga;
    });

    const responseWeeklyData = Object.keys(weeklyData).map(weekNumber => ({
        minggu: parseInt(weekNumber),
        bulan: weeklyData[weekNumber].month,
        tahun: weeklyData[weekNumber].year,
        totalVolume: weeklyData[weekNumber].totalVolume,
        totalHarga: weeklyData[weekNumber].totalHarga,
    }));


    res.status(200).json({
        status: 'success',
        data: {
            weeklyData: responseWeeklyData,
        },
    });
}));

router.get('/admin/water/usage/monthly', authCheck, asyncHandler(async (req, res) => {

    let waterUsage;

    if (req.user.role === 0) {
        waterUsage = await database('waterusage');
    }

    if (req.user.role === 1) {

        waterUsage = await database('waterusage').where({ waterDepotId: req.user.depotId });
    }

    if (req.user.role === 2) {
        waterUsage = await database('waterusage').where({ userId: req.user.userId });
    }

    if (!waterUsage) {
        throw new NotFoundError(`Water Usage tidak ditemukan`);
    }

    const responseMonthlyData = [];
    waterUsage.forEach((usage) => {
        const date = new Date(usage.tanggal);

        if (!isNaN(date.getTime())) {
            const year = date.getFullYear();
            const monthName = date.toLocaleString('default', { month: 'long' });

            const existingMonthIndex = responseMonthlyData.findIndex(data => data.bulan === monthName && data.tahun === year);

            if (existingMonthIndex !== -1) {
                responseMonthlyData[existingMonthIndex].totalVolume += usage.volume;
                responseMonthlyData[existingMonthIndex].totalHarga += usage.totalHarga;
            } else {
                responseMonthlyData.push({
                    bulan: monthName,
                    tahun: year,
                    totalVolume: usage.volume,
                    totalHarga: usage.totalHarga,
                });
            }
        } else {
            console.error('Format tanggal tidak valid:', usage.tanggal);
        }
    });

    res.status(200).json({
        status: 'success',
        data: {
            monthlyData: responseMonthlyData,
        },
    });
}));

router.get('/admin/water/usage/monthly/:id', authCheck, asyncHandler(async (req, res) => {

    const { id } = req.params;

    let waterUsage;

    if (req.user.role === 0) {
        const waterUsageData = await database('waterusage');
        waterUsage = waterUsageData.filter((item) => item.userId == id);
    }

    if (req.user.role === 1) {
        const waterUsageData = await database('waterusage').where({ waterDepotId: req.user.depotId });
        waterUsage = waterUsageData.filter((item) => item.userId == id);
    }

    if (req.user.role === 2) {
        throw new AuthorizationError('Anda tidak berhak mengakses resource ini');
    }

    if (!waterUsage) {
        throw new NotFoundError(`Water Usage tidak ditemukan`);
    }

    const responseMonthlyData = [];
    waterUsage.forEach((usage) => {
        const date = new Date(usage.tanggal);

        if (!isNaN(date.getTime())) {
            const year = date.getFullYear();
            const monthName = date.toLocaleString('default', { month: 'long' });

            const existingMonthIndex = responseMonthlyData.findIndex(data => data.bulan === monthName && data.tahun === year);

            if (existingMonthIndex !== -1) {
                responseMonthlyData[existingMonthIndex].totalVolume += usage.volume;
                responseMonthlyData[existingMonthIndex].totalHarga += usage.totalHarga;
            } else {
                responseMonthlyData.push({
                    bulan: monthName,
                    tahun: year,
                    totalVolume: usage.volume,
                    totalHarga: usage.totalHarga,
                });
            }
        } else {
            console.error('Format tanggal tidak valid:', usage.tanggal);
        }
    });

    res.status(200).json({
        status: 'success',
        data: {
            monthlyData: responseMonthlyData,
        },
    });
}));


router.get('/admin/water/usage/yearly', authCheck, asyncHandler(async (req, res) => {

    let waterUsage;

    if (req.user.role === 0) {
        waterUsage = await database('waterusage');
    }

    if (req.user.role === 1) {

        waterUsage = await database('waterusage').where({ waterDepotId: req.user.depotId });
    }

    if (req.user.role === 2) {
        waterUsage = await database('waterusage').where({ userId: req.user.userId });
    }

    if (!waterUsage) {
        throw new NotFoundError(`Water Usage tidak ditemukan`);
    }

    const yearlyData = {};
    waterUsage.forEach((usage) => {
        const year = new Date(usage.tanggal).getFullYear();

        if (!yearlyData[year]) {
            yearlyData[year] = {
                totalVolume: 0,
                totalHarga: 0,
            };
        }

        yearlyData[year].totalVolume += usage.volume;
        yearlyData[year].totalHarga += usage.totalHarga;
    });

    const responseYearlyData = Object.keys(yearlyData).map(year => ({
        tahun: parseInt(year),
        totalVolume: yearlyData[year].totalVolume,
        totalHarga: yearlyData[year].totalHarga,
    }));

    res.status(200).json({
        status: 'success',
        data: {
            yearlyData: responseYearlyData
        },
    });
}));

router.get('/admin/water/usage/yearly/:id', authCheck, asyncHandler(async (req, res) => {

    const { id } = req.params;

    let waterUsage;

    if (req.user.role === 0) {
        const waterUsageData = await database('waterusage');
        waterUsage = waterUsageData.filter((item) => item.userId == id);
    }

    if (req.user.role === 1) {
        const waterUsageData = await database('waterusage').where({ waterDepotId: req.user.depotId });
        waterUsage = waterUsageData.filter((item) => item.userId == id);
    }

    if (req.user.role === 2) {
        throw new AuthorizationError('Anda tidak berhak mengakses resource ini');
    }

    if (!waterUsage) {
        throw new NotFoundError(`Water Usage tidak ditemukan`);
    }

    const yearlyData = {};
    waterUsage.forEach((usage) => {
        const year = new Date(usage.tanggal).getFullYear();

        if (!yearlyData[year]) {
            yearlyData[year] = {
                totalVolume: 0,
                totalHarga: 0,
            };
        }

        yearlyData[year].totalVolume += usage.volume;
        yearlyData[year].totalHarga += usage.totalHarga;
    });

    const responseYearlyData = Object.keys(yearlyData).map(year => ({
        tahun: parseInt(year),
        totalVolume: yearlyData[year].totalVolume,
        totalHarga: yearlyData[year].totalHarga,
    }));

    res.status(200).json({
        status: 'success',
        data: {
            yearlyData: responseYearlyData
        },
    });
}));


router.post('/waterusage', asyncHandler(async (req, res) => {

    const {
        id,
        username,
        userId,
        volume,
        tanggal,
        waterDepotId,
        waterDepot,
        totalHarga
    } = req.body;

    const [year, month, day] = tanggal.split('/');
    const date = new Date(`${year}-${month}-${day}`);
    const isoString = date.toISOString();

    const waterUsage = await database('waterusage').insert({
        id,
        username,
        userId,
        volume,
        tanggal: isoString,
        waterDepotId,
        waterDepot,
        totalHarga
    }).returning('*');

    if (!waterUsage) {
        throw new ClientError('Water Usage gagal dibuat. silahkan ulangi');
    }

    res.status(200).json({
        status: 'success',
        message: 'Water Usage berhasil dibuat',
        data: {
            waterUsage,
        },
    });
}));

router.delete('/waterusage', asyncHandler(async (req, res) => {
    // const { id } = req.params;

    // // const waterDepot = await database('waterusage').where({ id }).first();

    // if (!waterDepot) {
    //     throw new NotFoundError(`Tidak dapat menghapus data. Water usage dengan id ${id} tidak ditemukan.`);
    // }

    await database('waterusage').del();

    res.status(200).json({
        status: 'success',
        message: `Water usage berhasil dihapus`,
    });
}));



module.exports = router;
