import { NextApiRequest, NextApiResponse } from 'next';
import { processAndStoreVideo } from '../../scripts/processVideo';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { videoId } = req.query;

  if (!videoId || typeof videoId !== 'string') {
    return res.status(400).json({ error: 'Video ID is required' });
  }

  try {
    const videoMetadata = await processAndStoreVideo(videoId);

    if (videoMetadata) {
      return res.status(200).json(videoMetadata);
    } else {
      return res.status(500).json({ error: 'Failed to process video' });
    }
  } catch (err) {
    console.error(`Error processing video ${videoId}:`, err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
