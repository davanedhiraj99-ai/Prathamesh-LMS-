import checkAuth from '../../middleware/check-auth.js';
import { Router } from 'express';

const router = Router();

router.post('/', checkAuth(async (req, res) => {
  const { title } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  try {
    const createResponse = await fetch(
      `https://video.bunnycdn.com/library/${process.env.BUNNY_LIBRARY_ID}/videos`,
      {
        method: 'POST',
        headers: {
          'AccessKey': process.env.BUNNY_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title })
      }
    );

    if (!createResponse.ok) {
      throw new Error(`Bunny create failed: ${createResponse.status}`);
    }

    const videoData = await createResponse.json();
    
    res.status(200).json({
      success: true,
      videoId: videoData.guid,
      libraryId: process.env.BUNNY_LIBRARY_ID,
      title: videoData.title
    });
  } catch (error) {
    console.error('Bunny upload init error:', error);
    res.status(500).json({ 
      error: 'Failed to initialize video upload',
      details: error.message 
    });
  }
}, 'admin'));

export default router;