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

async function getWaterUsages () {
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
  const waterUsageJson = await waterUsageResponse.json()

  return waterUsageJson
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

module.exports = {
  getAccessToken,
  getWaterUsages,
  createUser,
  updateUserById,
  deleteUserById,
  createWaterPrice,
  updateWaterPriceById,
  deleteWaterPriceById,
}
