import { NextApiRequest, NextApiResponse } from 'next';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { videoId, author, description, s3Url } = req.body;

    try {
      const query = `
        INSERT INTO videos (video_id, author, description, s3_url)
        VALUES ($1, $2, $3, $4) RETURNING *;
      `;
      const values = [videoId, author, description, s3Url];
      const result = await pool.query(query, values);

      res.status(200).json(result.rows[0]);
    } catch (error) {
      console.error('Error saving video to the database:', error);
      res.status(500).json({ error: 'Database error' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
