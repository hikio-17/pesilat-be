const asyncHandler = require('express-async-handler')

const express = require('express')
const { database } = require('../database')
const ClientError = require('../exeptions/ClientError')
const NotFoundError = require('../exeptions/NotFoundError')
const { validateWaterDepotData } = require('../validators/waterDepotValidate')
const {
  validateWaterDepotUpdateData
} = require('../validators/waterDepotUpdateValidate')
const { superAdmin, authCheck } = require('../middlewares/auth')
const { syncronizeWaterDepots, syncronizeWaterUsages } = require('../utils/api')

const router = express.Router()

router.get(
  '/water-depots',
  asyncHandler(async (req, res) => {
    // Sinkronize
    await syncronizeWaterDepots();
    await syncronizeWaterUsages();

    const waterDepots = await database('waterdepots');
    const waterUsages = await database('waterusage');

    const waterDepotData = waterDepots.map((item) => {
      return {
        ...item,
        waterUsages: waterUsages.filter((i) => i.waterDepotId === item.id),
      }
    })

    res.status(200).json({
      status: 'success',
      data: {
        waterDepots: waterDepotData,
      }
    });
  })
)

router.get(
  '/water-depots/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Sinkronize
    await syncronizeWaterDepots();
    await syncronizeWaterUsages();
  
    const waterDepot = await database('waterdepots').where({ id }).first();

    if (!waterDepot) {
      throw new NotFoundError(`Water Depot dengan id ${id} tidak ditemukan`)
    }

    // Get Data Water Usage
    const waterUsages = await database('waterusage').where({ waterDepotId: id });

    res.status(200).json({
      status: 'success',
      data: {
        waterDepot: {
          ...waterDepot,
          waterUsages
        }
      }
    });
  }),
)

router.post(
  '/water-depots',
  validateWaterDepotData,
  authCheck,
  superAdmin,
  asyncHandler(async (req, res) => {
    const waterDepot = await database('waterdepots')
      .insert(req.body)
      .returning('*')

    if (!waterDepot) {
      throw new ClientError('Water Depots gagal dibuat. silahkan ulangi')
    }

    res.status(201).json({
      status: 'success',
      message: 'Water depot berhasil dibuat',
      data: {
        waterDepot
      }
    })
  })
)

router.put(
  '/water-depots/:id',
  validateWaterDepotUpdateData,
  authCheck,
  superAdmin,
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const waterDepot = await database('waterdepots').where({ id }).first()

    if (!waterDepot) {
      throw new NotFoundError(
        `Tidak dapat memperbarui data. Water depot dengan id ${id} tidak ditemukan.`
      )
    }

    const updatedData = {
      ...waterDepot,
      ...req.body
    }

    await database('waterdepots').where({ id }).update(updatedData)

    res.status(200).json({
      status: 'success',
      message: `Water depot dengan id ${id} berhasil diperbarui`
    })
  })
)

router.delete(
  '/water-depots/:id',
  authCheck,
  superAdmin,
  asyncHandler(async (req, res) => {
    const { id } = req.params

    const waterDepot = await database('waterdepots').where({ id }).first()

    if (!waterDepot) {
      throw new NotFoundError(
        `Tidak dapat menghapus data. Water depot dengan id ${id} tidak ditemukan.`
      )
    }

    await database('waterdepots').where({ id }).del()

    res.status(200).json({
      status: 'success',
      message: `Water depot dengan id ${id} berhasil dihapus`
    })
  })
)

module.exports = router
