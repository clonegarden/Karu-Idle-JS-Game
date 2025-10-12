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
    // Destructure all stat fields from body
    const {
      name,
      terra,
      fogo,
      agua,
      ar,
      gameStarted,
      clickpower,
      totalClicksEver,
      autoclickers,
      totalMoneyEver,
      totalMoneySpent
    } = body;
    if (!user_id) return res.status(400).json({ error: 'Missing user_id' });
    // Debug: log all values being sent to the query
    console.log('Updating character for user_id:', user_id);
    console.log('Query values:', {
      name,
      terra,
      fogo,
      agua,
      ar,
      gameStarted,
      clickpower,
      totalClicksEver,
      autoclickers,
      totalMoneyEver,
      totalMoneySpent
    });
    try {
      await pool.query(
        `UPDATE characters SET
          name = $1,
          terra = $2,
          fogo = $3,
          agua = $4,
          ar = $5,
          game_started = $6,
          click_power = $7,
          total_clicks_ever = $8,
          autoclickers = $9,
          total_money_ever = $10,
          total_money_spent = $11
        WHERE user_id = $12`,
        [
          name,
          terra,
          fogo,
          agua,
          ar,
          gameStarted,
          clickpower,
          totalClicksEver,
          autoclickers,
          totalMoneyEver,
          totalMoneySpent,
          user_id
        ]
      );
      res.status(200).json({ success: true });
    } catch (sqlError) {
      console.error('SQL error during character update:', sqlError);
      res.status(500).json({ error: 'Failed to update character', details: sqlError.message, values: {
        name,
        terra,
        fogo,
        agua,
        ar,
        gameStarted,
        clickpower,
        totalClicksEver,
        autoclickers,
        totalMoneyEver,
        totalMoneySpent,
        user_id
      }});
    }
  } catch (e) {
    console.error('General error in character-update:', e);
    res.status(500).json({ error: 'Failed to update character', details: e.message });
  }
};
