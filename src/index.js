require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { errorHandler } = require('./middlewares/errorHandler');
const userController = require('./controllers/user.controller');

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.use('/api/v1', userController);

app.use(errorHandler);

const PORT = process.env.PORT;

app.listen(PORT, () => {
   console.log(`Server running at http://localhost:${PORT}`);
})