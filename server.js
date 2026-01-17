
const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('render.com') ? { rejectUnauthorized: false } : false
});

const initDb = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        role TEXT DEFAULT 'Atendente'
      );
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        category TEXT,
        image TEXT
      );
      CREATE TABLE IF NOT EXISTS tables (
        id INTEGER PRIMARY KEY,
        status TEXT DEFAULT 'Livre',
        orders JSONB DEFAULT '[]'
      );
      CREATE TABLE IF NOT EXISTS sales (
        id TEXT PRIMARY KEY,
        total DECIMAL(10,2) NOT NULL,
        payment_method TEXT NOT NULL,
        items JSONB NOT NULL,
        user_id TEXT,
        timestamp BIGINT NOT NULL
      );
      
      -- Inicializar mesas se não existirem
      INSERT INTO tables (id, status, orders) 
      SELECT i, 'Livre', '[]' FROM generate_series(1, 12) s(i)
      ON CONFLICT DO NOTHING;
    `);
    console.log('Database initialized with Tables and Users');
  } catch (err) {
    console.error('Error initializing database', err);
  }
};
initDb();

// Users API
app.get('/api/users', async (req, res) => {
  const result = await pool.query('SELECT * FROM users');
  res.json(result.rows);
});
app.post('/api/users', async (req, res) => {
  const { id, name, role } = req.body;
  await pool.query('INSERT INTO users (id, name, role) VALUES ($1, $2, $3) ON CONFLICT (id) DO UPDATE SET name=$2, role=$3', [id, name, role]);
  res.sendStatus(200);
});
app.delete('/api/users/:id', async (req, res) => {
  await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
  res.sendStatus(200);
});

// Products API
app.get('/api/products', async (req, res) => {
  const result = await pool.query('SELECT * FROM products ORDER BY name');
  res.json(result.rows);
});
app.post('/api/products', async (req, res) => {
  const { id, name, price, category, image } = req.body;
  await pool.query('INSERT INTO products (id, name, price, category, image) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO UPDATE SET name=$2, price=$3, category=$4, image=$5', [id, name, price, category, image]);
  res.sendStatus(200);
});

// Tables API (Real-time storage)
app.get('/api/tables', async (req, res) => {
  const result = await pool.query('SELECT * FROM tables ORDER BY id');
  res.json(result.rows);
});
app.post('/api/tables/:id/order', async (req, res) => {
  const { status, orders } = req.body;
  await pool.query('UPDATE tables SET status = $1, orders = $2 WHERE id = $3', [status, JSON.stringify(orders), req.params.id]);
  res.sendStatus(200);
});

// Sales API
app.get('/api/sales', async (req, res) => {
  const result = await pool.query('SELECT * FROM sales ORDER BY timestamp DESC');
  res.json(result.rows.map(s => ({
    id: s.id,
    total: parseFloat(s.total),
    paymentMethod: s.payment_method,
    items: s.items,
    userId: s.user_id,
    timestamp: parseInt(s.timestamp)
  })));
});
app.post('/api/sales', async (req, res) => {
  const { id, total, paymentMethod, items, userId, timestamp } = req.body;
  await pool.query('INSERT INTO sales (id, total, payment_method, items, user_id, timestamp) VALUES ($1, $2, $3, $4, $5, $6)', [id, total, paymentMethod, JSON.stringify(items), userId, timestamp]);
  res.sendStatus(200);
});

app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
