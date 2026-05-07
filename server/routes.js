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

// Schema from project writeup:
// restaurant(camis PK, ..., gmap_business_id FK nullable)
// inspection(inspection_id PK, camis FK, inspection_date, score, grade, action, ...)
// violation(violation_id PK, inspection_id FK, violation_code, critical_flag, ...)
// violation_code(code PK, description)
// gmap_business(gmap_business_id PK, avg_rating, num_of_reviews, price, ...)
async function resolveTables() {
  return {
    restaurant: 'restaurant',
    inspection: 'inspection',
    violation: 'violation',
    violationCode: 'violation_code',
    gmap: 'gmap_business',
  };
}

function send500(res, err) {
  // Avoid leaking secrets. Client gets a short message in production,
  // but include SQL error details in dev to speed up schema fixes.
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
const searchRestaurants = async (req, res) => {
  try {
    const { restaurant, inspection, gmap } = await resolveTables();

    const name = qText(req.query.name);
    const boro = qText(req.query.boro);
    const cuisine = qText(req.query.cuisine);
    const grade = qText(req.query.grade);
    const minRating = qFloat(req.query.min_rating, null);

    const latestInspection = `
      with latest as (
        select camis, max(inspection_date) as latest_date
        from ${inspection}
        where score is not null
        group by camis
      )
      select i.camis, i.inspection_date, i.score, i.grade, i.action
      from ${inspection} i
      join latest l on l.camis = i.camis and l.latest_date = i.inspection_date
    `;

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
      left join (${latestInspection}) li on li.camis = r.camis
      left join ${gmap} g on r.gmap_business_id = g.gmap_business_id
      ${where}
      order by r.dba asc
      limit 200
    `;

    const result = await pool.query(sql, params);
    res.json(result.rows);
  } catch (err) {
    send500(res, err);
  }
};

// GET /api/restaurants/:camis
const getRestaurantProfile = async (req, res) => {
  try {
    const { restaurant, inspection, gmap } = await resolveTables();

    const camis = qText(req.params.camis);
    if (!camis) return res.status(400).json({ error: 'Missing camis' });

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
      left join (
        select *, row_number() over (partition by camis order by inspection_date desc, inspection_id desc) as rn
        from ${inspection}
        where camis = $1
      ) l on r.camis = l.camis and l.rn = 1
      where r.camis = $1
    `;

    const { rows } = await pool.query(sql, [camis]);
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
    const { inspection } = await resolveTables();
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
const getMismatch = async (req, res) => {
  try {
    const { restaurant, inspection, gmap } = await resolveTables();

    const minRating = qFloat(req.query.min_rating, 4.0);
    const minScore = qInt(req.query.min_score, 28);
    const boroFilter = qText(req.query.boro);
    const cuisineFilter = qText(req.query.cuisine);

    const params = [minRating, minScore];
    let p = 3;
    const extraWhere = [];
    if (boroFilter) { extraWhere.push(`lower(r.boro) = lower($${p})`); params.push(boroFilter); p++; }
    if (cuisineFilter) { extraWhere.push(`r.cuisine_description ilike $${p}`); params.push(`%${cuisineFilter}%`); p++; }

    const sql = `
      with latest_dates as (
        select camis, max(inspection_date) as latest_date
        from ${inspection}
        where score is not null
        group by camis
      )
      select
        r.camis,
        r.dba as name,
        r.boro as borough,
        r.cuisine_description as cuisine,
        g.avg_rating as google_rating,
        g.num_of_reviews as review_count,
        i.score as latest_score,
        i.grade as latest_grade
      from ${restaurant} r
      join ${gmap} g on r.gmap_business_id = g.gmap_business_id
      join latest_dates ld on r.camis = ld.camis
      join ${inspection} i on i.camis = ld.camis and i.inspection_date = ld.latest_date
      where g.avg_rating >= $1
        and i.score >= $2
        ${extraWhere.length ? `and ${extraWhere.join(' and ')}` : ''}
      order by i.score desc, g.avg_rating desc
      limit 500
    `;

    const { rows } = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    send500(res, err);
  }
};

// GET /api/analytics/repeat-offenders?min_times=3&boro=
const getRepeatOffenders = async (req, res) => {
  try {
    const { restaurant, inspection, violation, violationCode: vcTable } = await resolveTables();

    const minTimes = qInt(req.query.min_times, 3);
    const boroFilter = qText(req.query.boro);
    const cuisineFilter = qText(req.query.cuisine);
    const vcFilter = qText(req.query.violation_code);

    const params = [minTimes];
    let p = 2;
    const where = [];
    if (boroFilter) { where.push(`lower(r.boro) = lower($${p})`); params.push(boroFilter); p++; }
    if (cuisineFilter) { where.push(`r.cuisine_description ilike $${p}`); params.push(`%${cuisineFilter}%`); p++; }
    if (vcFilter) { where.push(`v.violation_code ilike $${p}`); params.push(`%${vcFilter}%`); p++; }

    const sql = `
      select
        r.camis,
        r.dba as name,
        r.boro as borough,
        r.cuisine_description as cuisine,
        v.violation_code,
        vc.description as violation_description,
        count(distinct i.inspection_id)::int as times_cited
      from ${restaurant} r
      join ${inspection} i on r.camis = i.camis
      join ${violation} v on i.inspection_id = v.inspection_id
      join ${vcTable} vc on v.violation_code = vc.code
      where lower(v.critical_flag) like '%critical%'
        ${where.length ? `and ${where.join(' and ')}` : ''}
      group by r.camis, r.dba, r.boro, r.cuisine_description, v.violation_code, vc.description
      having count(distinct i.inspection_id) >= $1
      order by times_cited desc
      limit 500
    `;
    const { rows } = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    send500(res, err);
  }
};

// GET /api/analytics/borough-stats
const getBoroughStats = async (req, res) => {
  try {
    const { restaurant, inspection } = await resolveTables();

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
    const { rows } = await pool.query(sql);
    res.json(rows);
  } catch (err) {
    send500(res, err);
  }
};

// GET /api/analytics/declining?min_inspections=3
const getDeclining = async (req, res) => {
  try {
    const { restaurant, inspection } = await resolveTables();

    const minInspections = qInt(req.query.min_inspections, 3);

    const sql = `
      with avg_scores as (
        select camis, avg(score)::float as avg_score, count(*)::int as num_inspections
        from ${inspection}
        where score is not null
        group by camis
      ),
      latest_dates as (
        select camis, max(inspection_date) as latest_date
        from ${inspection}
        where score is not null
        group by camis
      )
      select
        r.camis,
        r.dba as name,
        r.boro as borough,
        r.cuisine_description as cuisine,
        i.inspection_date as latest_inspection_date,
        i.score as latest_score,
        a.avg_score,
        (i.score - a.avg_score)::float as score_increase
      from ${restaurant} r
      join avg_scores a on r.camis = a.camis
      join latest_dates ld on r.camis = ld.camis
      join ${inspection} i on i.camis = ld.camis and i.inspection_date = ld.latest_date
      where a.num_inspections >= $1
        and i.score > a.avg_score
      order by score_increase desc
      limit 500
    `;
    const { rows } = await pool.query(sql, [minInspections]);
    res.json(rows);
  } catch (err) {
    send500(res, err);
  }
};

// GET /api/violations/common
const getCommonViolations = async (req, res) => {
  try {
    const { restaurant, inspection, violation, violationCode } = await resolveTables();

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
    const { rows } = await pool.query(sql);
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