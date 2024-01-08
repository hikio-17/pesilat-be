/* eslint-disable no-unused-vars */
/* eslint-disable no-console */
require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const FileUpload = require("express-fileupload");
const cron = require('node-cron')
const cors = require('cors')
const morgan = require('morgan');
const { errorHandler } = require('./middlewares/errorHandler')
const userController = require('./controllers/user.controller')
const authController = require('./controllers/auth.controller')
const waterDepotsController = require('./controllers/waterDepots.controller')
const waterUsagesController = require('./controllers/waterUsage.controller')
const waterPriceController = require('./controllers/waterPrice.controller')
const { database } = require('./database')
const sensorDataController = require('./controllers/sensorDatas.controller')
const api = require('./utils/api')

const app = express()

app.use(cors());
app.use(morgan('combined'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(FileUpload());
app.use(express.static('./src/public'));

app.get('/', (req, res) => {
  res.send('ok')
})
app.use('/api/v1', userController)
app.use('/api/v1', authController)
app.use('/api/v1', waterDepotsController)
app.use('/api/v1', waterUsagesController)
app.use('/api/v1', waterPriceController)
app.use('/api/v1', sensorDataController)

cron.schedule('0 * */3 * * *', async () => {
  // try {
  //   const time = new Date();
  //   console.log('Memulai Sinkronisasi data', `${time.getHours()} : ${time.getMinutes()} : ${time.getSeconds()}`)
   
  //   const waterUsage = await api.getWaterUsages();
    
  //   if (waterUsage.length > 0) {
  //     await database('waterusage').truncate()
  //     await database('waterusage').insert(waterUsage);
  //     console.log('Sinkronisasi Data berhasil', `${time.getHours()} : ${time.getMinutes()} : ${time.getSeconds()}`)
  //   }
  // } catch (error) {
  //   console.log(error)
  // }
})

app.use('/api/v1/seeders', async (req, res) => {
  // await database('waterdepots').insert({
  //   id: 2,
  //   nama: 'Jakarta',
  //   tanggalPasang: '2023-12-09T11:18:00.000Z',
  //   lokasi: 'Jakarta',
  //   keterangan: 'Pusat',
  //   latitude: '-6.200000',
  //   longitude: '106.816666',
  //   waterUsages: [],
  //   updatedDate: '2023-12-31T04:18:54.057Z',
  //   syncDate: '2023-12-31T04:18:54.057Z'
  // })

  const waterUsage = await database('waterusage').insert({
    user: 'Sukijap',
    userId: 29,
    volume: 220,
    tanggal: '08-01-2024',
    waterDepotId: 1,
    waterDepot: 'Cikarang',
    totalHarga: 25000,
  }).returning('*');

  res.status(200).json(waterUsage[0])
})

app.use(errorHandler)

const { PORT } = process.env

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`)
})
