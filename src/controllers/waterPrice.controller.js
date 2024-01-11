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

router.post('/water-price', validateWaterPriceData, authCheck, superAdmin, asyncHandler(async (req, res) => {
    const waterPriceData = {
        ...req.body,
        updatedBy: req.user.fullName,
    };

    const formData = new FormData();

    for (const [key, value] of Object.entries(waterPriceData)) {
        formData.set(key, value);
    }

    // created Water Price
    const waterPrice = await createWaterPrice(FormData);

    console.log(waterPrice, 'ini hasil created nya');

    // Inser to db
    await database('waterprice').insert(waterPrice);

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