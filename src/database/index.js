const Knex = require('knex');
const configs = require('../../knexfile');

exports.database = Knex(configs.development);
