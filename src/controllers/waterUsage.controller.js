const asyncHandler = require('express-async-handler');

const express = require('express');
const { database } = require('../database');
const ClientError = require('../exeptions/ClientError');
const NotFoundError = require('../exeptions/NotFoundError');
const AuthorizationError = require('../exeptions/AuthorizationError');
const { superAdmin, authCheck } = require('../middlewares/auth');

const router = express.Router();

router.get('/water-usage', asyncHandler(async (req, res) => {
    const waterUsage = await database('waterusage');

    res.status(200).json({
        status: 'success',
        data: {
            waterUsage,
        },
    });
}));

router.get('/water-usage/:id', authCheck, asyncHandler(async (req, res) => {

    const { id } = req.params;
    const waterUsage = await database('waterusage').where({ id }).first();

    if (!waterUsage) {
        throw new NotFoundError(`Water usage dengan id ${id} tidak ditemukan`);
    }

    if (
        waterUsage.userId !== req.body.id ||
        req.body.role !== 0 ||
        req.body.role !== 1
    ) {
        throw new AuthorizationError('Anda tidak berhak mengakses resource ini');
    }

    res.status(200).json({
        status: 'success',
        data: {
            waterUsage,
        },
    });
}));

router.get('/water-usage/daily/:userid', authCheck, superAdmin, asyncHandler(async (req, res) => {
    const { userid } = req.params;

    // if (userid !== req.user.id || req.user.role !== 0 || req.user.role !== 1) {
    //     throw new AuthorizationError('Anda tidak berhak mengakses resource ini');
    // }

    const waterUsage = await database('waterusage').where({ userid }).first();

    if (!waterUsage) {
        throw new NotFoundError(`Water Usage dengan id ${userid} tidak ditemukan`);
    }

    res.status(200).json({
        status: 'success',
        data: {
            waterUsage,
        },
    });
}));

router.get('/water-usage/weekly/:userid', authCheck, superAdmin, asyncHandler(async (req, res) => {
    const { userid } = req.params;

    const waterUsage = await database('waterusage').where({ userId: userid });
    
    if (!waterUsage || waterUsage.length === 0) {
        throw new NotFoundError(`Data waterUsage untuk user dengan id ${userid} tidak ditemukan`);
    }

    function getWeekNumber(date) {
        const oneJan = new Date(date.getFullYear(), 0, 1);
        const timeDiff = date - oneJan;
        const dayOfYear = Math.ceil(timeDiff / 86400000);
        return Math.ceil(dayOfYear / 7);
    }

    const weeklyData = {};
    waterUsage.forEach(entry => {
        const entryDate = new Date(entry.tanggal);
        const weekNumber = getWeekNumber(entryDate);
        if (!weeklyData[weekNumber]) {
            weeklyData[weekNumber] = {
                totalVolume: 0,
                data: [],
            };
        }
        weeklyData[weekNumber].data.push(entry);
        weeklyData[weekNumber].totalVolume += entry.volume;
    });

    res.status(200).json({
        status: 'success',
        data: {
            weeklyData,
        },
    });
}));

router.get('/water-usage/monthly/:userid', authCheck, superAdmin, asyncHandler(async (req, res) => {
    const { userid } = req.params;

    const waterUsage = await database('waterusage').where({ userId: userid });
    
    if (!waterUsage || waterUsage.length === 0) {
        throw new NotFoundError(`Data waterUsage untuk user dengan id ${userid} tidak ditemukan`);
    }

    function getMonthNumber(date) {
        return date.getMonth() + 1; 
    }

    const monthlyData = {};
    waterUsage.forEach(entry => {
        const entryDate = new Date(entry.tanggal);
        const monthNumber = getMonthNumber(entryDate);
        if (!monthlyData[monthNumber]) {
            monthlyData[monthNumber] = {
                totalVolume: 0,
                data: [],
            };
        }
        monthlyData[monthNumber].data.push(entry);
        monthlyData[monthNumber].totalVolume += entry.volume;
    });

    res.status(200).json({
        status: 'success',
        data: {
            monthlyData,
        },
    });
}));

router.get('/water-usage/monthly/:userid', authCheck, superAdmin, asyncHandler(async (req, res) => {
    const { userid } = req.params;

    const waterUsage = await database('waterusage')
        .where({ userId: userid })
        .select('volume', 'totalHarga', 'tanggal') 
        .orderBy('tanggal'); 

    if (!waterUsage || waterUsage.length === 0) {
        throw new NotFoundError(`Water Usage dengan id ${userid} tidak ditemukan`);
    }

    const monthlyData = {};
    waterUsage.forEach((usage) => {
        const year = usage.tanggal.getFullYear();
        const month = usage.tanggal.getMonth() + 1;
        const key = `${year}-${month}`;
        
        if (!monthlyData[key]) {
            monthlyData[key] = {
                totalVolume: 0,
                totalHarga: 0,
            };
        }
        
        monthlyData[key].totalVolume += usage.volume;
        monthlyData[key].totalHarga += usage.totalHarga;
    });

    res.status(200).json({
        status: 'success',
        data: {
            monthlyData,
        },
    });
}));

router.get('/water-usage/yearly/:userid', authCheck, superAdmin, asyncHandler(async (req, res) => {
    const { userid } = req.params;

    const waterUsage = await database('waterusage')
        .where({ userId: userid })
        .select('volume', 'totalHarga', 'tanggal') 
        .orderBy('tanggal'); 

    if (!waterUsage || waterUsage.length === 0) {
        throw new NotFoundError(`Water Usage dengan id ${userid} tidak ditemukan`);
    }

    const yearlyData = {};
    waterUsage.forEach((usage) => {
        const year = usage.tanggal.getFullYear();
        
        if (!yearlyData[year]) {
            yearlyData[year] = {
                totalVolume: 0,
                totalHarga: 0,
            };
        }
        
        yearlyData[year].totalVolume += usage.volume;
        yearlyData[year].totalHarga += usage.totalHarga;
    });

    res.status(200).json({
        status: 'success',
        data: {
            yearlyData,
        },
    });
}));

router.post('/water-usage', asyncHandler(async (req, res) => {
    console.log(req.body)
    const waterUsage = await database('waterusage').insert(req.body).returning('*');

  if (!waterUsage) {
    throw new ClientError('Water Usage gagal dibuat. silahkan ulangi');
  }

  res.status(201).json({
    status: 'success',
    message: 'Water Usage berhasil dibuat',
    data: {
      waterUsage,
    },
  });
}));

router.delete('/water-usage/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;
  
    const waterDepot = await database('waterusage').where({ id }).first();
  
    if (!waterDepot) {
      throw new NotFoundError(`Tidak dapat menghapus data. Water usage dengan id ${id} tidak ditemukan.`);
    }
  
    await database('waterusage').where({ id }).del();
  
    res.status(200).json({
      status: 'success',
      message: `Water usage dengan id ${id} berhasil dihapus`,
    });
  }));



module.exports = router;
