import { http, toQuery } from './http';

export async function searchRestaurants({ name, boro, cuisine, grade, min_rating }) {
  const qs = toQuery({ name, boro, cuisine, grade, min_rating });
  const { data } = await http.get(`/api/restaurants/search?${qs}`);
  return data;
}

export async function getRestaurantProfile(camis) {
  const { data } = await http.get(`/api/restaurants/${encodeURIComponent(camis)}`);
  return data;
}

export async function getRestaurantInspections(camis) {
  const { data } = await http.get(`/api/restaurants/${encodeURIComponent(camis)}/inspections`);
  return data;
}

export async function getMismatch({ min_rating = 4.0, min_score = 28 } = {}) {
  const qs = toQuery({ min_rating, min_score });
  const { data } = await http.get(`/api/analytics/mismatch?${qs}`);
  return data;
}

export async function getRepeatOffenders({ min_times = 3, boro } = {}) {
  const qs = toQuery({ min_times, boro });
  const { data } = await http.get(`/api/analytics/repeat-offenders?${qs}`);
  return data;
}

export async function getBoroughStats() {
  const { data } = await http.get('/api/analytics/borough-stats');
  return data;
}

export async function getDeclining({ min_inspections = 3 } = {}) {
  const qs = toQuery({ min_inspections });
  const { data } = await http.get(`/api/analytics/declining?${qs}`);
  return data;
}

export async function getCommonViolations() {
  const { data } = await http.get('/api/violations/common');
  return data;
}

