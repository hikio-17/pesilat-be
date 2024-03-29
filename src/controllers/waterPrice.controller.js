const asyncHandler = require('express-async-handler');
const express = require('express');
const { database } = require('../database');
const NotFoundError = require('../exeptions/NotFoundError');
const { superAdmin, authCheck } = require('../middlewares/auth');
const { validateWaterPriceData } = require('../validators/waterPriceValidate');
const { syncronizeWaterPrice, createWaterPrice } = require('../utils/api');

const router = express.Router();

router.get('/water-price', asyncHandler(async (req, res) => {
    // sinchronize data
    await syncronizeWaterPrice();
    
    const waterPrices = await database('waterprice');

    res.status(200).json({
        status: 'success',
        data: {
            waterPrices,
        },
    });
}));

router.get('/water-price/:id', asyncHandler(async (req, res) => {
    // syncronize data
    await syncronizeWaterPrice();
    const { id } = req.params;
    const waterPrice = await database('waterprice').where({ id }).first();

    if (!waterPrice) {
        throw new NotFoundError(`Water price dengan id ${ id } tidak ditemukan`);
    }

    res.status(200).json({
        status: 'success',
        data: {
            waterPrice,
        },
    });
}));

router.post('/water-price', authCheck, asyncHandler(async (req, res) => {
    console.log(req.body)
    // created Water Price
    const payload = new FormData();

    Object.keys(req.body).forEach((key) => {
        payload.append(key, req.body[key])
    });

    console.log(payload);

    const waterPrice = await createWaterPrice(payload);
    res.status(200).json({
        status: 'success',
        data: {
            waterPrice,
        }
    })
}));

router.put('/water-price/:id', authCheck, superAdmin, asyncHandler(async (req, res) => {
    const { id } = req.params;
    const waterPrice = await database('waterprice').where({ id }).first();

    if (!waterPrice) {
        throw new NotFoundError(`Water price dengan id ${ id } tidak ditemukan`);
    };

    await database('waterprice').where({ id }).update({
        ...req.body,
        updatedBy: req.user.fullName,
    });

    const updatedWaterPrice = await database('waterprice').where({ id }).first();

    res.status(200).json({
        status: 'success',
        data: {
            updatedWaterPrice,
        },
    });
}));

router.delete('/water-price/:id', authCheck, superAdmin, asyncHandler(async (req, res) => {
    const { id } = req.params;
    const waterPrice = await database('waterprice').where({ id }).first();

    if (!waterPrice) {
        throw new NotFoundError(`Water price dengan id ${ id } tidak ditemukan`);
    }

    await database('waterprice').where({ id }).del();

    res.status(200).json({
        status: 'success',
        message: `Water price dengan id ${ id } berhasil dihapus`,
   });
}));

module.exports = router;