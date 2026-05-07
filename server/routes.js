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
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// ===== In-memory cache =====
// Used for slow-changing, frequently queried analytics routes.
// Cache entries expire after CACHE_TTL_MS milliseconds.
const cache = {};
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getCache(key) {
  const entry = cache[key];
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    delete cache[key];
    return null;
  }
  return entry.data;
}

function setCache(key, data) {
  cache[key] = { data, timestamp: Date.now() };
}

function qInt(v, fallback) {
  const n = Number.parseInt(String(v ?? ''), 10);
  return Number.isFinite(n) ? n : fallback;
}

function qFloat(v, fallback) {
  const n = Number.parseFloat(String(v ?? ''));
  return Number.isFinite(n) ? n : fallback;
}

function qText(v) {
  const s = String(v ?? '').trim();
  return s ? s : null;
}

// Table name constants — no need to call resolveTables() on every request
const TABLES = {
  restaurant: 'restaurant',
  inspection: 'inspection',
  violation: 'violation',
  violationCode: 'violation_code',
  gmap: 'gmap_business',
};

// Kept for backward compatibility with getSchemaDebug
async function resolveTables() {
  return TABLES;
}

function send500(res, err) {
  console.error(err);
  const isProd = process.env.NODE_ENV === 'production';
  res.status(500).json({
    error: 'Internal server error',
    ...(isProd
      ? {}
      : {
          detail: err?.message,
          code: err?.code,
          hint: err?.hint,
          where: err?.where,
        }),
  });
}

async function getColumns(tableName) {
  if (!tableName) return [];
  const { rows } = await pool.query(
    `
      select column_name, data_type
      from information_schema.columns
      where table_schema = 'public' and table_name = $1
      order by ordinal_position asc
    `,
    [tableName]
  );
  return rows;
}

// GET /api/_debug/schema
const getSchemaDebug = async (req, res) => {
  try {
    const tables = await resolveTables();
    const [restaurantCols, inspectionCols, violationCols, violationCodeCols, gmapCols] = await Promise.all([
      getColumns(tables.restaurant),
      getColumns(tables.inspection),
      getColumns(tables.violation),
      getColumns(tables.violationCode),
      getColumns(tables.gmap),
    ]);
    res.json({
      tables,
      columns: {
        restaurant: restaurantCols,
        inspection: inspectionCols,
        violation: violationCols,
        violation_code: violationCodeCols,
        gmap_business: gmapCols,
      },
    });
  } catch (err) {
    send500(res, err);
  }
};

// GET /api/_debug/ping
const getPing = async (req, res) => {
  res.json({
    ok: true,
    service: 'nyc-restaurant-api',
    ts: new Date().toISOString(),
  });
};

// ===== Legacy demo route =====
const restaurants = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT dba
      FROM restaurant
      LIMIT 5
    `);
    res.json(result.rows);
  } catch (err) {
    send500(res, err);
  }
};

// GET /api/restaurants/search?name=&boro=&cuisine=&grade=&min_rating=
// Uses latest_inspection materialized view instead of recomputing CTE on every request
const searchRestaurants = async (req, res) => {
  try {
    const { restaurant, gmap } = TABLES;

    const name = qText(req.query.name);
    const boro = qText(req.query.boro);
    const cuisine = qText(req.query.cuisine);
    const grade = qText(req.query.grade);
    const minRating = qFloat(req.query.min_rating, null);

    const parts = [];
    const params = [];
    let p = 1;

    if (name) {
      parts.push(`(r.dba ilike $${p})`);
      params.push(`%${name}%`);
      p++;
    }
    if (boro) {
      parts.push(`r.boro = $${p}`);
      params.push(boro);
      p++;
    }
    if (cuisine) {
      parts.push(`r.cuisine_description = $${p}`);
      params.push(cuisine);
      p++;
    }
    if (grade) {
      parts.push(`li.grade = $${p}`);
      params.push(grade);
      p++;
    }
    if (minRating != null) {
      parts.push(`g.avg_rating >= $${p}`);
      params.push(minRating);
      p++;
    }

    const where = parts.length ? `where ${parts.join(' and ')}` : '';

    // latest_inspection is a materialized view — no CTE recomputation needed
    const sql = `
      select
        r.camis,
        r.dba as name,
        r.boro as borough,
        r.cuisine_description as cuisine,
        li.grade as latest_grade,
        li.score as latest_score,
        g.avg_rating as google_rating,
        g.num_of_reviews as review_count
      from ${restaurant} r
      left join latest_inspection li on li.camis = r.camis
      left join ${gmap} g on r.gmap_business_id = g.gmap_business_id
      ${where}
      order by r.dba asc
      limit 200
    `;

    console.time('searchRestaurants');
    const result = await pool.query(sql, params);
    console.timeEnd('searchRestaurants');

    res.json(result.rows);
  } catch (err) {
    send500(res, err);
  }
};

// GET /api/restaurants/:camis
// Uses latest_inspection materialized view instead of ROW_NUMBER window function
const getRestaurantProfile = async (req, res) => {
  try {
    const { restaurant, gmap } = TABLES;

    const camis = qText(req.params.camis);
    if (!camis) return res.status(400).json({ error: 'Missing camis' });

    // latest_inspection materialized view replaces the expensive ROW_NUMBER subquery
    const sql = `
      select
        r.camis,
        r.dba,
        r.boro,
        r.building,
        r.street,
        r.zipcode,
        r.cuisine_description,
        g.name as google_name,
        g.avg_rating,
        g.num_of_reviews,
        g.price,
        l.score as latest_score,
        l.grade as latest_grade,
        l.inspection_date as latest_inspection_date,
        l.action as latest_action
      from ${restaurant} r
      left join ${gmap} g on r.gmap_business_id = g.gmap_business_id
      left join latest_inspection l on r.camis = l.camis
      where r.camis = $1
    `;

    console.time('getRestaurantProfile');
    const { rows } = await pool.query(sql, [camis]);
    console.timeEnd('getRestaurantProfile');

    if (!rows.length) return res.status(404).json({ error: 'Not found' });

    const row = rows[0];
    res.json({
      restaurant: {
        camis: row.camis,
        dba: row.dba,
        boro: row.boro,
        cuisine_description: row.cuisine_description,
        building: row.building,
        street: row.street,
        zipcode: row.zipcode,
      },
      latest_inspection: {
        inspection_date: row.latest_inspection_date,
        score: row.latest_score,
        grade: row.latest_grade,
        action: row.latest_action,
      },
      google: row.google_name
        ? {
            name: row.google_name,
            avg_rating: row.avg_rating,
            num_of_reviews: row.num_of_reviews,
            price: row.price,
          }
        : null,
    });
  } catch (err) {
    send500(res, err);
  }
};

// GET /api/restaurants/:camis/inspections
const getRestaurantInspections = async (req, res) => {
  try {
    const { inspection } = TABLES;
    const camis = qText(req.params.camis);
    if (!camis) return res.status(400).json({ error: 'Missing camis' });

    const sql = `
      select
        inspection_date,
        score,
        grade,
        action
      from ${inspection}
      where camis = $1
      order by inspection_date desc nulls last
      limit 200
    `;
    const { rows } = await pool.query(sql, [camis]);
    res.json(rows);
  } catch (err) {
    send500(res, err);
  }
};

// GET /api/analytics/mismatch?min_rating=4.0&min_score=28&boro=&cuisine=
// Uses latest_inspection materialized view — eliminates CTE recomputation on every request
const getMismatch = async (req, res) => {
  try {
    const { restaurant, gmap } = TABLES;

    const minRating = qFloat(req.query.min_rating, 4.0);
    const minScore = qInt(req.query.min_score, 28);
    const boroFilter = qText(req.query.boro);
    const cuisineFilter = qText(req.query.cuisine);

    const params = [minRating, minScore];
    let p = 3;
    const extraWhere = [];
    if (boroFilter) { extraWhere.push(`lower(r.boro) = lower($${p})`); params.push(boroFilter); p++; }
    if (cuisineFilter) { extraWhere.push(`r.cuisine_description ilike $${p}`); params.push(`%${cuisineFilter}%`); p++; }

    // Replaces:
    //   WITH latest_dates AS (SELECT camis, MAX(inspection_date) ... GROUP BY camis)
    //   JOIN inspection i ON i.camis = ld.camis AND i.inspection_date = ld.latest_date
    // With a direct join to the precomputed latest_inspection materialized view
    const sql = `
      select
        r.camis,
        r.dba as name,
        r.boro as borough,
        r.cuisine_description as cuisine,
        g.avg_rating as google_rating,
        g.num_of_reviews as review_count,
        li.score as latest_score,
        li.grade as latest_grade
      from ${restaurant} r
      join ${gmap} g on r.gmap_business_id = g.gmap_business_id
      join latest_inspection li on r.camis = li.camis
      where g.avg_rating >= $1
        and li.score >= $2
        ${extraWhere.length ? `and ${extraWhere.join(' and ')}` : ''}
      order by li.score desc, g.avg_rating desc
      limit 500
    `;

    console.time('getMismatch');
    const { rows } = await pool.query(sql, params);
    console.timeEnd('getMismatch');

    res.json(rows);
  } catch (err) {
    send500(res, err);
  }
};

// GET /api/analytics/repeat-offenders?min_times=3&boro=&cuisine=&violation_code=
// Uses repeat_offenders materialized view — eliminates 4-table join + COUNT(DISTINCT) on every request
const getRepeatOffenders = async (req, res) => {
  try {
    const boroFilter = qText(req.query.boro);
    const cuisineFilter = qText(req.query.cuisine);
    const vcFilter = qText(req.query.violation_code);

    const params = [];
    let p = 1;
    const where = [];
    if (boroFilter) { where.push(`lower(boro) = lower($${p})`); params.push(boroFilter); p++; }
    if (cuisineFilter) { where.push(`cuisine_description ilike $${p}`); params.push(`%${cuisineFilter}%`); p++; }
    if (vcFilter) { where.push(`violation_code ilike $${p}`); params.push(`%${vcFilter}%`); p++; }

    // Replaces:
    //   4-table join (restaurant, inspection, violation, violation_code)
    //   WHERE critical_flag LIKE '%critical%'
    //   GROUP BY ... HAVING COUNT(DISTINCT inspection_id) >= 3
    // With a direct SELECT from the precomputed repeat_offenders materialized view
    const sql = `
      select
        camis,
        dba as name,
        boro as borough,
        cuisine_description as cuisine,
        violation_code,
        description as violation_description,
        times_cited
      from repeat_offenders
      ${where.length ? `where ${where.join(' and ')}` : ''}
      order by times_cited desc
      limit 500
    `;

    console.time('getRepeatOffenders');
    const { rows } = await pool.query(sql, params);
    console.timeEnd('getRepeatOffenders');

    res.json(rows);
  } catch (err) {
    send500(res, err);
  }
};

// GET /api/analytics/borough-stats
// Cached: borough stats change only when new inspections are added
const getBoroughStats = async (req, res) => {
  try {
    const cached = getCache('borough_stats');
    if (cached) {
      console.log('getBoroughStats: cache hit');
      return res.json(cached);
    }

    const { restaurant, inspection } = TABLES;

    const sql = `
      select
        r.boro as borough,
        count(distinct r.camis)::int as restaurant_count,
        avg(i.score)::float as avg_inspection_score,
        avg(case when i.grade = 'A' then 1.0 else 0.0 end)::float as a_grade_rate
      from ${restaurant} r
      join ${inspection} i on r.camis = i.camis
      where i.score is not null and r.boro is not null and r.boro <> ''
      group by r.boro
      order by avg_inspection_score desc
    `;

    console.time('getBoroughStats');
    const { rows } = await pool.query(sql);
    console.timeEnd('getBoroughStats');

    setCache('borough_stats', rows);
    res.json(rows);
  } catch (err) {
    send500(res, err);
  }
};

// GET /api/analytics/declining?min_inspections=3
// Uses declining_restaurants materialized view — eliminates two CTE full scans on every request
const getDeclining = async (req, res) => {
  try {
    const minInspections = qInt(req.query.min_inspections, 3);

    // Replaces:
    //   WITH avg_scores AS (SELECT camis, AVG(score) ... FROM inspection GROUP BY camis)
    //   WITH latest_dates AS (SELECT camis, MAX(inspection_date) ... FROM inspection GROUP BY camis)
    //   JOIN inspection i ON i.camis = ld.camis AND i.inspection_date = ld.latest_date
    // With a direct SELECT from the precomputed declining_restaurants materialized view
    const sql = `
      select
        camis,
        dba as name,
        boro as borough,
        cuisine_description as cuisine,
        latest_inspection_date,
        latest_score,
        avg_score,
        score_increase
      from declining_restaurants
      where num_inspections >= $1
      order by score_increase desc
      limit 500
    `;

    console.time('getDeclining');
    const { rows } = await pool.query(sql, [minInspections]);
    console.timeEnd('getDeclining');

    res.json(rows);
  } catch (err) {
    send500(res, err);
  }
};

// GET /api/violations/common
// Cached: violation frequency by borough changes only when new inspections are added
const getCommonViolations = async (req, res) => {
  try {
    const cached = getCache('common_violations');
    if (cached) {
      console.log('getCommonViolations: cache hit');
      return res.json(cached);
    }

    const { restaurant, inspection, violation, violationCode } = TABLES;

    // This query is kept as-is since it uses ROW_NUMBER for top-5-per-borough ranking
    // which does not simplify further with a materialized view given the dynamic rn filter.
    // Caching handles the performance instead.
    const sql = `
      with v as (
        select
          r.boro as borough,
          v.violation_code,
          vc.description as violation_description,
          count(*)::int as count
        from ${restaurant} r
        join ${inspection} i on r.camis = i.camis
        join ${violation} v on i.inspection_id = v.inspection_id
        join ${violationCode} vc on v.violation_code = vc.code
        where r.boro is not null
        group by r.boro, v.violation_code, vc.description
      ),
      ranked as (
        select *, row_number() over (partition by borough order by count desc) as rn
        from v
      )
      select borough, violation_code, violation_description, count
      from ranked
      where rn <= 5
      order by borough, count desc
    `;

    console.time('getCommonViolations');
    const { rows } = await pool.query(sql);
    console.timeEnd('getCommonViolations');

    setCache('common_violations', rows);
    res.json(rows);
  } catch (err) {
    send500(res, err);
  }
};

module.exports = {
  restaurants,
  getSchemaDebug,
  getPing,
  searchRestaurants,
  getRestaurantProfile,
  getRestaurantInspections,
  getMismatch,
  getRepeatOffenders,
  getBoroughStats,
  getDeclining,
  getCommonViolations,
};
