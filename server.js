const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') || !process.env.DATABASE_URL
    ? false 
    : { rejectUnauthorized: false }
});

const initDb = async () => {
  try {
    // Teste de conexão
    await pool.query('SELECT NOW()');
    console.log('Connected to PostgreSQL successfully');

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
      
      INSERT INTO tables (id, status, orders) 
      SELECT i, 'Livre', '[]' FROM generate_series(1, 12) s(i)
      ON CONFLICT DO NOTHING;
    `);
    console.log('Database schema verified/created');
  } catch (err) {
    console.error('CRITICAL: Database connection error:', err.message);
  }
};
initDb();

// Rotas da API
app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users ORDER BY name');
    res.json(result.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/users', async (req, res) => {
  const { id, name, role } = req.body;
  try {
    await pool.query('INSERT INTO users (id, name, role) VALUES ($1, $2, $3) ON CONFLICT (id) DO UPDATE SET name=$2, role=$3', [id, name, role]);
    res.sendStatus(200);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
    res.sendStatus(200);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/products', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products ORDER BY name');
    res.json(result.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/products', async (req, res) => {
  const { id, name, price, category, image } = req.body;
  try {
    await pool.query('INSERT INTO products (id, name, price, category, image) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO UPDATE SET name=$2, price=$3, category=$4, image=$5', [id, name, price, category, image]);
    res.sendStatus(200);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM products WHERE id = $1', [req.params.id]);
    res.sendStatus(200);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/tables', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tables ORDER BY id');
    res.json(result.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/tables/:id/order', async (req, res) => {
  const { status, orders } = req.body;
  try {
    await pool.query('UPDATE tables SET status = $1, orders = $2 WHERE id = $3', [status, JSON.stringify(orders), req.params.id]);
    res.sendStatus(200);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/sales', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM sales ORDER BY timestamp DESC');
    res.json(result.rows.map(s => ({
      id: s.id,
      total: parseFloat(s.total),
      paymentMethod: s.payment_method,
      items: s.items,
      userId: s.user_id,
      timestamp: parseInt(s.timestamp)
    })));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/sales', async (req, res) => {
  const { id, total, paymentMethod, items, userId, timestamp } = req.body;
  try {
    await pool.query('INSERT INTO sales (id, total, payment_method, items, user_id, timestamp) VALUES ($1, $2, $3, $4, $5, $6)', [id, total, paymentMethod, JSON.stringify(items), userId, timestamp]);
    res.sendStatus(200);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Middleware para servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'dist')));

// Redireciona todas as outras rotas para o index.html (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Smart PDV Server running on port ${PORT}`);
});