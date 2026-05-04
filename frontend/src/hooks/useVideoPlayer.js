import { useState, useEffect, useCallback, useRef } from 'react';
import axios from '../utils/axios-instance.js';

export const useVideoPlayer = (bunnyVideoId) => {
  const [signedUrl, setSignedUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const refreshTimer = useRef(null);

  const fetchSignedUrl = useCallback(async () => {
    if (!bunnyVideoId) {
      setSignedUrl('');
      setError('Missing video id');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/student/sign-video', { bunnyVideoId });
      setSignedUrl(response.data.signedUrl);
      setError(null);
    } catch (err) {
      setSignedUrl('');
      setError(err.response?.data?.error || 'Failed to load video');
    } finally {
      setLoading(false);
    }
  }, [bunnyVideoId]);

  useEffect(() => {
    fetchSignedUrl();

    if (refreshTimer.current) clearInterval(refreshTimer.current);
    if (bunnyVideoId) {
      refreshTimer.current = setInterval(fetchSignedUrl, 4 * 60 * 1000);
    }

    return () => {
      if (refreshTimer.current) {
        clearInterval(refreshTimer.current);
      }
    };
  }, [fetchSignedUrl, bunnyVideoId]);

  return { signedUrl, loading, error, refresh: fetchSignedUrl };
};
