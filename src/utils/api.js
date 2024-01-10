const { database } = require("../database");

const BASE_URL = 'https://waterpositive.my.id';

async function getAccessToken () {
  const responseAccessToken = await fetch(
    `${process.env.BASE_URL}/UserApi/authenticate`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        apiKey: '123qweasd'
      })
    }
  )

  const responseAccessTokenJson = await responseAccessToken.json()

  const { token } = responseAccessTokenJson

  return token
}

async function syncronizeWaterUsages () {
  try {
    const token = await getAccessToken()
    const waterUsageResponse = await fetch(
      'https://waterpositive.my.id/api/WaterUsage/GetAllData',
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    )
    const waterUsageJson = await waterUsageResponse.json();

    if (waterUsageJson.length > 0) {
      await database('waterusage').truncate();
      await database('waterusage').insert(waterUsageJson);
    }

    return waterUsageJson
  } catch (error) {
    console.log(error);
  }
}

async function createUser (data) {

}

async function updateUserById (data, id) {

}

async function deleteUserById (id) {

}

async function createWaterPrice () {

}

async function updateWaterPriceById (data, id) {

}

async function deleteWaterPriceById (id) {

}

async function getAllUsers() {
  const token = await getAccessToken();
  const responseUsers = await fetch('https://waterpositive.my.id/api/UserProfile/GetAllData', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const users = await responseUsers.json();

  console.log('users', users);

  return users;
}

async function syncronizeWaterDepots () {
  try {
    const token = await getAccessToken();
    const responseWaterDepots = await fetch('https://waterpositive.my.id/api/WaterDepot/GetAllData', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const waterDepots = await responseWaterDepots.json();

    if (waterDepots.length > 0) {
      await database('waterdepots').truncate();
      await database('waterdepots').insert(waterDepots);
    }

    return waterDepots;
  } catch (error) {
    console.log(error);
  }
}

module.exports = {
  getAccessToken,
  createUser,
  updateUserById,
  deleteUserById,
  createWaterPrice,
  updateWaterPriceById,
  deleteWaterPriceById,
  getAllUsers,
  syncronizeWaterDepots,
  syncronizeWaterUsages
}
