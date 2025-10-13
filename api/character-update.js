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
    // Ensure integer fields are cast to integers
    const terraInt = parseInt(terra) || 0;
    const fogoInt = parseInt(fogo) || 0;
    const aguaInt = parseInt(agua) || 0;
    const arInt = parseInt(ar) || 0;
    const gameStartedInt = parseInt(gameStarted) || 0;
    const clickpowerInt = parseInt(clickpower) || 0;
    const totalClicksEverInt = parseInt(totalClicksEver) || 0;
    const autoclickersInt = parseInt(autoclickers) || 0;
    const totalMoneyEverInt = Math.round(Number(totalMoneyEver)) || 0;
    const totalMoneySpentInt = parseInt(totalMoneySpent) || 0;
    // Debug: log all values being sent to the query
    console.log('Updating character for user_id:', user_id);
    console.log('Query values:', {
      name,
      terra: terraInt,
      fogo: fogoInt,
      agua: aguaInt,
      ar: arInt,
      gameStarted: gameStartedInt,
      clickpower: clickpowerInt,
      totalClicksEver: totalClicksEverInt,
      autoclickers: autoclickersInt,
      totalMoneyEver: totalMoneyEverInt,
      totalMoneySpent: totalMoneySpentInt
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
          terraInt,
          fogoInt,
          aguaInt,
          arInt,
          gameStartedInt,
          clickpowerInt,
          totalClicksEverInt,
          autoclickersInt,
          totalMoneyEverInt,
          totalMoneySpentInt,
          user_id
        ]
      );
      res.status(200).json({ success: true });
    } catch (sqlError) {
      console.error('SQL error during character update:', sqlError);
      res.status(500).json({ error: 'Failed to update character', details: sqlError.message, values: {
        name,
        terra: terraInt,
        fogo: fogoInt,
        agua: aguaInt,
        ar: arInt,
        gameStarted: gameStartedInt,
        clickpower: clickpowerInt,
        totalClicksEver: totalClicksEverInt,
        autoclickers: autoclickersInt,
        totalMoneyEver: totalMoneyEverInt,
        totalMoneySpent: totalMoneySpentInt,
        user_id
      }});
    }
  } catch (e) {
    console.error('General error in character-update:', e);
    res.status(500).json({ error: 'Failed to update character', details: e.message });
  }
};
