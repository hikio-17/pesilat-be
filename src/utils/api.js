const { database } = require("../database");

const BASE_URL = 'https://waterpositive.my.id';

async function getAccessToken() {
  const responseAccessToken = await fetch(
    'https://waterpositive.my.id/UserApi/authenticate',
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

async function syncronizeWaterUsages() {
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
  } catch (error) {
    console.log(error);
  }
}

async function createUser(data) {
  try {
    const token = await getAccessToken();
    const userResponse = await fetch('https://waterpositive.my.id/api/UserProfile/InsertData', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: data,
    });

    const isCreated = await userResponse.json();

    if (isCreated) {
      const usersResponse = await fetch('https://waterpositive.my.id/api/UserProfile/GetAllData', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const users = await usersResponse.json();
      console.log(users.slice(-1)[0])

      return users[users.length - 1];
    }
  } catch (error) {
    console.log('CREATE USER FROM API ERROR', error)
  }
}

async function updateUserById(data, id) {

  try {
    console.log(data)
    const token = await getAccessToken();
    const userResponse = await fetch('https://waterpositive.my.id/api/UserProfile/UpdateData', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: data,
    });

    // const isUpdate = await userResponse.json();

    if (userResponse.ok) {
      const usersResponse = await fetch('https://waterpositive.my.id/api/UserProfile/GetAllData', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const users = await usersResponse.json();
      const userUpdated = users.find((item) => item.id == id);
      // console.log(userUpdated);
      return userUpdated;
    }

  } catch (error) {
    console.log('UPDATE USER FROM API ERROR', error)
  }

}

async function deleteUserById(id) {

}

async function createWaterPrice(data) {
  try {
    const token = await getAccessToken();
    const waterPriceResponse = await fetch('https://waterpositive.my.id/api/WaterPrice/InsertData', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: data,
    });

    const isWaterPriceCreated = await waterPriceResponse.json();
    if (isWaterPriceCreated) {
      const waterPriceResponse = await fetch('https://waterpositive.my.id/api/WaterPrice/GetAllData', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });

      const waterPrice = await waterPriceResponse.json();

      await syncronizeWaterPrice();
      return waterPrice[waterPrice.length - 1];
    }
  } catch (error) {
    console.log(error);
  }
}

async function updateWaterPriceById(data, id) {

}

async function deleteWaterPriceById(id) {

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

  return users;
}

async function getWaterTankData() {
  const token = await getAccessToken();
  const responseUsers = await fetch('https://waterpositive.my.id/api/WaterTankData/GetLastData?Count=1', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const data = await responseUsers.json();

  return data;
}

async function syncronizeWaterDepots() {
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
  } catch (error) {
    console.log(error);
  }
}

async function syncronizeWaterPrice() {
  try {
    const token = await getAccessToken();

    const waterPriceResponse = await fetch('https://waterpositive.my.id/api/WaterPrice/GetAllData', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const waterPrice = await waterPriceResponse.json();

    if (waterPrice.length > 0) {
      await database('waterprice').truncate();
      await database('waterprice').insert(waterPrice);
    }
  } catch (error) {
    console.log(error);
  }
}

async function updateActiveUserStatus() {
  try {
    mostRecentUpdate = await database('waterusage').select('userId')
      .max('updatedDate as mostRecentDate')
      .groupBy('userId');

    const currentDate = new Date();

    for (const entry of mostRecentUpdate) {
      const mostRecentDate = new Date(entry.mostRecentDate);
      const timeDifference = currentDate.getTime() - mostRecentDate.getTime();
      const daysDifference = Math.floor(timeDifference / (1000 * 3600 * 24));

      const allUsersData = await getAllUsers();

      const userData = allUsersData.filter((item) => item.id === entry.userId)
      const formData = new FormData();
      for (const [key, value] of Object.entries(userData[0])) {
        formData.set(key, value);
      }
      formData.set('aktif', daysDifference <= 30 ? 'true' : 'false');
      formData.set('updatedDate', new Date().toISOString());

      await updateUserById(formData, entry.userId);
      await database('users').where('id', entry.userId).update({ aktif: daysDifference <= 30 });
    }

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
  getWaterTankData,
  syncronizeWaterDepots,
  syncronizeWaterUsages,
  syncronizeWaterPrice,
  updateActiveUserStatus,
}
