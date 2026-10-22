const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'hp-fan-site-secret-change-in-production';

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

const db = new Database(path.join(__dirname, 'fansite.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    house TEXT DEFAULT 'Gryffindor',
    avatar TEXT DEFAULT '/avatars/default.png',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

app.post('/api/signup', async (req, res) => {
  try {
    const { username, email, password, house } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    const hashed = await bcrypt.hash(password, 10);
    const stmt = db.prepare('INSERT INTO users (username, email, password, house) VALUES (?, ?, ?, ?)');
    const result = stmt.run(username, email, hashed, house || 'Gryffindor');
    const token = jwt.sign({ id: result.lastInsertRowid, username, house: house || 'Gryffindor' }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: result.lastInsertRowid, username, email, house: house || 'Gryffindor' } });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Username or email already exists' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, username: user.username, house: user.house }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, username: user.username, email: user.email, house: user.house, avatar: user.avatar } });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/me', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT id, username, email, house, avatar, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

app.get('/api/houses', (req, res) => {
  res.json([
    { name: 'Gryffindor', colors: ['#740001', '#d3a625'], trait: 'Bravery', animal: 'Lion' },
    { name: 'Slytherin', colors: ['#1a472a', '#aaaaaa'], trait: 'Ambition', animal: 'Serpent' },
    { name: 'Ravenclaw', colors: ['#0e1a40', '#946b2d'], trait: 'Wisdom', animal: 'Eagle' },
    { name: 'Hufflepuff', colors: ['#ecb939', '#372e29'], trait: 'Loyalty', animal: 'Badger' }
  ]);
});

app.use(express.static(path.join(__dirname, '..', 'frontend')));

app.listen(PORT, () => {
  console.log(`Harry Potter Fan Site API running on http://localhost:${PORT}`);
});
