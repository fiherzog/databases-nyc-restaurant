const express = require('express');
const cors = require('cors');
const config = require('./config.json');
const api = require('./routes');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

// Legacy (kept for backward compatibility)
app.get('/restaurants', api.restaurants);

// Frontend expects these under /api/...
app.get('/api/restaurants/search', api.searchRestaurants);
app.get('/api/restaurants/:camis', api.getRestaurantProfile);
app.get('/api/restaurants/:camis/inspections', api.getRestaurantInspections);

app.get('/api/analytics/mismatch', api.getMismatch);
app.get('/api/analytics/repeat-offenders', api.getRepeatOffenders);
app.get('/api/analytics/borough-stats', api.getBoroughStats);
app.get('/api/analytics/declining', api.getDeclining);

app.get('/api/violations/common', api.getCommonViolations);

// Debug helper to quickly inspect DB schema (dev-only use)
app.get('/api/_debug/schema', api.getSchemaDebug);
app.get('/api/_debug/ping', api.getPing);

app.listen(config.server_port, () => {
  console.log(`Server running at http://${config.server_host}:${config.server_port}`);
  console.log('API mounted under /api (including /api/_debug/ping)');
});