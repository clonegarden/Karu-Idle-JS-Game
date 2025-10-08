import dotenv from 'dotenv';
import pkg from 'pg';
import jwt from 'jsonwebtoken';

dotenv.config();
const { Pool } = pkg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export default async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'No token' });

  try {
    const token = auth.split(' ')[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user_id = payload.id;
    let body = req.body;
    if (typeof body === 'string') {
      body = JSON.parse(body);
    }
    const { name } = body;
    if (!name || !user_id) return res.status(400).json({ error: 'Missing name or user_id' });
    await pool.query('UPDATE characters SET name = $1 WHERE user_id = $2', [name, user_id]);
    res.status(200).json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update name', details: e.message });
  }
};
