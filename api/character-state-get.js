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
    const character_id = payload.character_id || payload.id;
    // Fetch extended state for character
    const stateResult = await pool.query('SELECT * FROM character_state WHERE character_id = $1 LIMIT 1', [character_id]);
    if (stateResult.rows.length === 0) {
      res.status(404).json({ error: 'Character state not found' });
      return;
    }
    const state = stateResult.rows[0];
    res.status(200).json({
      character_state: {
        unlockedAvatar: state.unlocked_avatar,
        unlockedAchievement: state.unlocked_achievement,
        unlockedSkill: state.unlocked_skill,
        unlockedTheme: state.unlocked_theme,
        unlockedMusic: state.unlocked_music,
        karugems: state.karugems,
        shopProgression: state.shop_progression,
        mapPosition: state.map_position
      }
    });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token', details: err.message });
  }
};
