import checkAuth from '../../middleware/check-auth.js';
import { Router } from 'express';
import { isRetryableBunnyStatus } from '../../utils/bunny-stream.js';

const router = Router();

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

router.post('/', checkAuth(async (req, res) => {
  const { title } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  try {
    let createResponse = null;

    for (let attempt = 1; attempt <= 3; attempt += 1) {
      createResponse = await fetch(
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

      if (createResponse.ok || !isRetryableBunnyStatus(createResponse.status) || attempt === 3) {
        break;
      }

      await sleep(500 * attempt);
    }

    if (!createResponse.ok) {
      const text = await createResponse.text().catch(() => '');
      const error = new Error(`Bunny create failed: ${createResponse.status} ${text}`);
      error.statusCode = createResponse.status;
      throw error;
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
    const isTemporaryBunnyFailure = isRetryableBunnyStatus(error.statusCode);
    res.status(isTemporaryBunnyFailure ? 503 : 500).json({ 
      error: isTemporaryBunnyFailure
        ? 'Bunny is temporarily unavailable. Please try the upload again in a minute.'
        : 'Failed to initialize video upload',
      details: error.message 
    });
  }
}, 'admin'));

export default router;
