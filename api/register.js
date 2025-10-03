import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from './db.js';

dotenv.config();

export default async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  const { username, password } = body;
  if (!username || !password) {
    res.status(400).json({ error: 'Username and password required' });
    return;
  }
  try {
    console.log('Tentando registrar usuário:', username);
    const userCheck = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (userCheck.rows.length > 0) {
      console.log('Usuário já existe:', username);
      res.status(409).json({ error: 'User already exists' });
      return;
    }
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username',
      [username, hash]
    );
    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '7d' });
    console.log('Usuário registrado com sucesso:', username);
    res.status(201).json({ token, user: { id: user.id, username: user.username } });
  } catch (err) {
    console.error('Erro ao registrar usuário:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};
