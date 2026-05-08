# NYC Restaurant Explorer

NYC Restaurant Explorer is a full-stack web application that integrates NYC Department of Health 
and Mental Hygiene (DOHMH) restaurant inspection records with Google Maps business metadata. The 
platform allows users to search restaurants by borough, cuisine, and inspection grade, and provides 
analytics tools to identify safety-rating mismatches, repeat health violators, declining 
restaurants, and borough-level inspection trends — bridging the gap between public perception and 
public health.

---

## Prerequisites

Make sure you have the following installed:
- Node.js (v18 or higher recommended)
- npm

---

## Project Structure


├── client/       # React frontend

└── server/       # Node.js/Express backend

---

## Running the Backend

1. Navigate to the server directory:

```bash
cd server
```

2. Install dependencies:

```bash
npm install
```

3. Configure your database connection by editing `config.json`:

```json
{
  "server_host": "localhost",
  "server_port": 8080,
  "db_user": "your_db_user",
  "db_host": "your_db_host",
  "db_database": "postgres",
  "db_password": "your_db_password",
  "db_port": 5432
}
```

4. Start the server:

```bash
node server.js
```

The API will be available at `http://localhost:8080`. You can verify it is running by visiting
`http://localhost:8080/api/_debug/ping`.

---

## Running the Frontend

In a separate terminal:

1. Navigate to the client directory:

```bash
cd client
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm start
```

The app will open at `http://localhost:3000`. API requests are automatically proxied to
`localhost:8080` via the `proxy` field in `client/package.json`, so both servers must be running
simultaneously.

---

## Database Setup

The application requires a PostgreSQL database with the following tables: `restaurant`,
`inspection`, `violation`, `violation_code`, and `gmap_business`. It also requires three
materialized views — `latest_inspection`, `repeat_offenders`, and `declining_restaurants` — and
associated indexes for full performance. See the appendix of the project report for the complete
DDL and index definitions.

---

## Available Pages

| Route | Page |
|---|---|
| `/` | Restaurant search |
| `/restaurants/:camis` | Individual restaurant profile and inspection history |
| `/danger-zone` | High-rated but poorly inspected restaurants |
| `/repeat-offenders` | Restaurants with repeated critical violations |
| `/declining` | Restaurants with worsening inspection scores |
| `/borough-analytics` | Borough-level inspection and rating statistics |
