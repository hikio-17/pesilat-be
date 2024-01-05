/* eslint-disable no-unused-vars */
/* eslint-disable no-console */
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cron = require('node-cron');
const cors = require('cors');
const { errorHandler } = require('./middlewares/errorHandler');
const userController = require('./controllers/user.controller');
const authController = require('./controllers/auth.controller');
const waterDepotsController = require('./controllers/waterDepots.controller');
const waterUsagesController = require('./controllers/waterUsage.controller');
const waterPriceController = require('./controllers/waterPrice.controller');
const { database } = require('./database');
const sensorDataController = require('./controllers/sensorDatas.controller');

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('./src/public'));

app.get('/', (req, res) => {
  res.send('ok');
});
app.use('/api/v1', userController);
app.use('/api/v1', authController);
app.use('/api/v1', waterDepotsController);
app.use('/api/v1', waterUsagesController);
app.use('/api/v1', waterPriceController);
app.use('/api/v1', sensorDataController);

cron.schedule('*/1 * * * * ', async () => {
   const responseAccessToken = await fetch(`${process.env.BASE_URL}/UserApi/authenticate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apiKey: '123qweasd',
      }),
    });

    const responseAccessTokenJson = await responseAccessToken.json();

    const { token } = responseAccessTokenJson;
});

app.use(errorHandler);

const { PORT } = process.env;

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
