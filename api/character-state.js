
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
    // Destructure extended state fields from body
    const {
      unlockedAvatar,
      unlockedAchievement,
      unlockedSkill,
      unlockedTheme,
      unlockedMusic,
      karugems,
      shopProgression,
      mapPosition
    } = body;
    if (!user_id) return res.status(400).json({ error: 'Missing user_id' });

    // Fetch character's primary key (id) from characters table
    let character_id;
    try {
      const charRes = await pool.query('SELECT id FROM characters WHERE user_id = $1 LIMIT 1', [user_id]);
      if (charRes.rows.length === 0) {
        return res.status(404).json({ error: 'Character not found for user' });
      }
      character_id = charRes.rows[0].id;
    } catch (fetchErr) {
      return res.status(500).json({ error: 'Failed to fetch character_id', details: fetchErr.message });
    }

    try {
      await pool.query(
        `INSERT INTO character_state (
          character_id,
          unlocked_avatar,
          unlocked_achievement,
          unlocked_skill,
          unlocked_theme,
          unlocked_music,
          karugems,
          shop_progression,
          map_position
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        ON CONFLICT (character_id) DO UPDATE SET
          unlocked_avatar = $2,
          unlocked_achievement = $3,
          unlocked_skill = $4,
          unlocked_theme = $5,
          unlocked_music = $6,
          karugems = $7,
          shop_progression = $8,
          map_position = $9
        `,
        [
          character_id,
          JSON.stringify(unlockedAvatar),
          JSON.stringify(unlockedAchievement),
          JSON.stringify(unlockedSkill),
          JSON.stringify(unlockedTheme),
          JSON.stringify(unlockedMusic),
          karugems,
          JSON.stringify(shopProgression),
          JSON.stringify(mapPosition)
        ]
      );
      res.status(200).json({ success: true });
    } catch (sqlError) {
      console.error('SQL error during character_state update:', sqlError);
      res.status(500).json({ error: 'Failed to update character_state', details: sqlError.message });
    }
  } catch (err) {
    res.status(401).json({ error: 'Invalid token', details: err.message });
  }
};
