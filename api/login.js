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
    console.log('Tentando login para usuário:', username);
    const userCheck = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (userCheck.rows.length === 0) {
      console.log('Usuário não encontrado:', username);
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    const user = userCheck.rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      console.log('Senha inválida para usuário:', username);
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '7d' });
    console.log('Login bem-sucedido para usuário:', username);
    res.status(200).json({ token, user: { id: user.id, username: user.username } });
  } catch (err) {
    console.error('Erro ao fazer login:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};
