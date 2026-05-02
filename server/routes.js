const { Pool } = require('pg');
const config = require('./config.json');

// connect to your database
const pool = new Pool({
  user: config.db_user,
  host: config.db_host,
  database: config.db_database,
  password: config.db_password,
  port: config.db_port,
  ssl: {
    rejectUnauthorized: false,
  },
});

// ===== REAL ROUTE =====
const restaurants = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT dba
      FROM restaurant
      LIMIT 5
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({});
  }
};

module.exports = {
  restaurants
};