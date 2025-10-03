import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import pool from './db.js';

dotenv.config();

export default async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }
  const token = auth.replace('Bearer ', '');
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const userId = payload.id;
    // Busca personagem do usuário
    const result = await pool.query('SELECT * FROM characters WHERE user_id = $1 LIMIT 1', [userId]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Character not found' });
      return;
    }
    res.status(200).json({ character: result.rows[0] });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token', details: err.message });
  }
};
