const express = require('express');
const cors = require('cors');
const config = require('./config.json');
const routes = require('./routes');

const app = express();
app.use(cors({ origin: '*' }));

app.get('/restaurants', routes.restaurants);

app.listen(config.server_port, () => {
  console.log(`Server running at http://${config.server_host}:${config.server_port}`);
});