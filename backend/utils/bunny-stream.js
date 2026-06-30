import pool from './db-client.js';
import {
  claimPendingBunnyCleanupJobs,
  ensureBunnyResilienceSchema,
  enqueueBunnyCleanupJob,
  markBunnyCleanupJobFailure,
  markBunnyCleanupJobSuccess,
  markBunnySyncFailure,
  markBunnySyncSuccess,
  shouldSkipBunnySync
} from './bunny-resilience.js';

const BUNNY_RETRYABLE_STATUS_CODES = new Set([408, 425, 429, 500, 502, 503, 504]);

function isRetryableBunnyStatus(statusCode) {
  return BUNNY_RETRYABLE_STATUS_CODES.has(Number(statusCode));
}

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetries(url, options = {}, maxAttempts = 3) {
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetch(url, options);

      if (response.ok || !isRetryableBunnyStatus(response.status) || attempt === maxAttempts) {
        return response;
      }

      await sleep(350 * attempt);
    } catch (error) {
      lastError = error;

      if (attempt === maxAttempts) {
        throw error;
      }

      await sleep(350 * attempt);
    }
  }

  throw lastError || new Error('Bunny request failed');
}

function getBunnyConfig() {
  const apiKey = String(process.env.BUNNY_API_KEY || '').trim();
  const libraryId = String(process.env.BUNNY_LIBRARY_ID || '').trim();

  if (!apiKey || !libraryId) {
    return null;
  }

  return { apiKey, libraryId };
}

function getBunnyStorageConfig() {
  const storageZone = String(process.env.BUNNY_STORAGE_ZONE || '').trim();
  const storagePassword = String(process.env.BUNNY_STORAGE_PASSWORD || '').trim();
  const storageHost = String(process.env.BUNNY_STORAGE_HOST || 'storage.bunnycdn.com').trim();
  const pullZoneHost = String(process.env.BUNNY_PULL_ZONE_HOST || '').trim();

  if (!storageZone || !storagePassword || !pullZoneHost) {
    return null;
  }

  return { storageZone, storagePassword, storageHost, pullZoneHost };
}

function buildStoragePathFromUrl(fileUrl) {
  const config = getBunnyStorageConfig();
  if (!config || !fileUrl) return null;

  try {
    const parsedUrl = new URL(fileUrl);
    const normalizedHost = parsedUrl.host.toLowerCase();
    const expectedHost = config.pullZoneHost.toLowerCase();

    if (!normalizedHost.endsWith(expectedHost)) {
      return null;
    }

    return parsedUrl.pathname.replace(/^\/+/, '');
  } catch {
    return null;
  }
}

async function fetchVideoDetails(videoId) {
  const config = getBunnyConfig();
  if (!config || !videoId) return null;

  const response = await fetchWithRetries(
    `https://video.bunnycdn.com/library/${config.libraryId}/videos/${videoId}`,
    {
      headers: {
        AccessKey: config.apiKey
      }
    }
  );

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    const error = new Error(`Bunny status fetch failed: ${response.status} ${text}`);
    error.statusCode = response.status;
    throw error;
  }

  return response.json();
}

async function deleteVideoFromBunny(videoId) {
  const config = getBunnyConfig();
  if (!config || !videoId) return false;

  const response = await fetchWithRetries(
    `https://video.bunnycdn.com/library/${config.libraryId}/videos/${videoId}`,
    {
      method: 'DELETE',
      headers: {
        AccessKey: config.apiKey
      }
    }
  );

  if (response.status === 404) {
    return false;
  }

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    const error = new Error(`Bunny video delete failed: ${response.status} ${text}`);
    error.statusCode = response.status;
    throw error;
  }

  return true;
}

async function deleteNoteFromBunny(fileUrl) {
  const config = getBunnyStorageConfig();
  const storagePath = buildStoragePathFromUrl(fileUrl);
  if (!config || !storagePath) return false;

  const response = await fetch(
    `https://${config.storageHost}/${config.storageZone}/${storagePath}`,
    {
      method: 'DELETE',
      headers: {
        AccessKey: config.storagePassword
      }
    }
  );

  if (response.status === 404) {
    return false;
  }

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    const error = new Error(`Bunny note delete failed: ${response.status} ${text}`);
    error.statusCode = response.status;
    throw error;
  }

  return true;
}

async function deleteCleanupTarget(contentType, targetKey) {
  if (contentType === 'video') {
    return deleteVideoFromBunny(targetKey);
  }

  if (contentType === 'note') {
    return deleteNoteFromBunny(targetKey);
  }

  return false;
}

async function deleteBatchContentRow(id) {
  const result = await pool.query('DELETE FROM batch_content WHERE id = $1 RETURNING *', [id]);
  return result.rows[0] || null;
}

async function ensureNoteStillExists(fileUrl) {
  const config = getBunnyStorageConfig();
  const storagePath = buildStoragePathFromUrl(fileUrl);

  if (!config || !storagePath) {
    return null;
  }

  const response = await fetchWithRetries(
    `https://${config.storageHost}/${config.storageZone}/${storagePath}`,
    {
      method: 'HEAD',
      headers: {
        AccessKey: config.storagePassword
      }
    }
  );

  if (response.status === 404) {
    const error = new Error('Bunny note not found');
    error.statusCode = 404;
    throw error;
  }

  if (!response.ok) {
    const error = new Error(`Bunny note sync failed: ${response.status}`);
    error.statusCode = response.status;
    throw error;
  }

  return true;
}

function mapBunnyStatus(videoData) {
  if (!videoData) return null;

  if (videoData.encodeProgress === 100 || videoData.status === 4) {
    return 'ready';
  }

  if (videoData.status === 5) {
    return 'failed';
  }

  if (videoData.status === 3 || videoData.status === 2) {
    return 'processing';
  }

  return 'uploading';
}

export async function syncVideoStatuses(videoRows = []) {
  await ensureBunnyResilienceSchema();

  const candidates = videoRows.filter(
    (row) => row?.type === 'video' && row?.url && row?.status !== 'failed'
  );
  if (candidates.length === 0) return videoRows;

  const syncedRows = await Promise.all(
    candidates.map(async (row) => {
      try {
        if (await shouldSkipBunnySync(row)) {
          return row;
        }

        const bunnyVideo = await fetchVideoDetails(row.url);
        const nextStatus = mapBunnyStatus(bunnyVideo) || row.status;
        const nextDuration =
          Number.isFinite(Number(bunnyVideo?.length)) && Number(bunnyVideo.length) > 0
            ? Math.round(Number(bunnyVideo.length))
            : row.duration;
        const nextThumbnail = bunnyVideo?.thumbnailFileName
          ? `https://thumbnail.bunnycdn.com/${process.env.BUNNY_LIBRARY_ID}/${row.url}.jpg`
          : row.thumbnail;

        if (
          nextStatus !== row.status ||
          nextDuration !== row.duration ||
          nextThumbnail !== row.thumbnail
        ) {
          return (
            (await markBunnySyncSuccess(row.id, {
              status: nextStatus,
              duration: nextDuration || null,
              thumbnail: nextThumbnail || null
            })) || {
              ...row,
              status: nextStatus,
              duration: nextDuration,
              thumbnail: nextThumbnail,
              bunny_sync_error_count: 0,
              bunny_last_sync_error: null,
              bunny_next_sync_attempt_at: null
            }
          );
        }

        return (
          (await markBunnySyncSuccess(row.id)) || {
            ...row,
            bunny_sync_error_count: 0,
            bunny_last_sync_error: null,
            bunny_next_sync_attempt_at: null
          }
        );
      } catch (error) {
        if (error.statusCode === 404) {
          try {
            await deleteBatchContentRow(row.id);
            return null;
          } catch (updateError) {
            console.error(`Failed to remove missing video ${row.id}:`, updateError.message);
          }
        }
        if (isRetryableBunnyStatus(error.statusCode)) {
          const updatedRow = await markBunnySyncFailure(row, error.message);
          console.error(`Bunny sync temporarily unavailable for video ${row.id}:`, error.message);
          return updatedRow;
        }

        console.error(`Bunny sync failed for video ${row.id}:`, error.message);
        return row;
      }
    })
  );

  const syncedMap = new Map(syncedRows.filter(Boolean).map((row) => [row.id, row]));
  return videoRows
    .filter((row) => row?.type !== 'video' || syncedMap.has(row.id))
    .map((row) => (row?.type === 'video' ? syncedMap.get(row.id) : row));
}

export async function syncNoteStatuses(noteRows = []) {
  await ensureBunnyResilienceSchema();

  const candidates = noteRows.filter((row) => row?.type === 'note' && row?.url);
  if (candidates.length === 0) return noteRows;

  const syncedRows = await Promise.all(
    candidates.map(async (row) => {
      try {
        if (await shouldSkipBunnySync(row)) {
          return row;
        }

        await ensureNoteStillExists(row.url);

        return (
          (await markBunnySyncSuccess(row.id)) || {
            ...row,
            bunny_sync_error_count: 0,
            bunny_last_sync_error: null,
            bunny_next_sync_attempt_at: null
          }
        );
      } catch (error) {
        if (error.statusCode === 404) {
          try {
            await deleteBatchContentRow(row.id);
            return null;
          } catch (updateError) {
            console.error(`Failed to remove missing note ${row.id}:`, updateError.message);
          }
        }

        if (isRetryableBunnyStatus(error.statusCode)) {
          const updatedRow = await markBunnySyncFailure(row, error.message);
          console.error(`Bunny sync temporarily unavailable for note ${row.id}:`, error.message);
          return updatedRow;
        }

        console.error(`Bunny sync failed for note ${row.id}:`, error.message);
        return row;
      }
    })
  );

  const syncedMap = new Map(syncedRows.filter(Boolean).map((row) => [row.id, row]));
  return noteRows
    .filter((row) => row?.type !== 'note' || syncedMap.has(row.id))
    .map((row) => (row?.type === 'note' ? syncedMap.get(row.id) : row));
}

export async function syncBatchContentRows(rows = []) {
  await processPendingBunnyCleanupJobs();
  const videoSyncedRows = await syncVideoStatuses(rows);
  return syncNoteStatuses(videoSyncedRows);
}

export async function syncBatchContentForBatchIds(batchIds = []) {
  const normalizedBatchIds = batchIds
    .map((batchId) => Number(batchId))
    .filter((batchId) => Number.isInteger(batchId) && batchId > 0);

  if (normalizedBatchIds.length === 0) return [];

  const result = await pool.query(
    `SELECT *
     FROM batch_content
     WHERE type = 'video'
       AND batch_id = ANY($1::int[])`,
    [normalizedBatchIds]
  );

  return syncBatchContentRows(result.rows);
}

export async function deleteRemoteBatchContent(row) {
  await ensureBunnyResilienceSchema();

  if (!row) return { deleted: false, skipped: true };

  if (row.type === 'video') {
    const deleted = await deleteVideoFromBunny(row.url);
    return { deleted, skipped: false };
  }

  if (row.type === 'note') {
    const deleted = await deleteNoteFromBunny(row.url);
    return { deleted, skipped: false };
  }

  return { deleted: false, skipped: true };
}

export async function queueRemoteBatchContentCleanup(row, errorMessage) {
  await ensureBunnyResilienceSchema();

  if (!row?.type || !row?.url) {
    return null;
  }

  return enqueueBunnyCleanupJob({
    contentType: row.type,
    targetKey: row.url,
    originalContentId: row.id,
    errorMessage
  });
}

export async function processPendingBunnyCleanupJobs(limit = 5) {
  await ensureBunnyResilienceSchema();

  const jobs = await claimPendingBunnyCleanupJobs(limit);

  for (const job of jobs) {
    try {
      await deleteCleanupTarget(job.content_type, job.target_key);
      await markBunnyCleanupJobSuccess(job.id);
    } catch (error) {
      if (!isRetryableBunnyStatus(error.statusCode)) {
        await markBunnyCleanupJobFailure(job, error.message);
        continue;
      }

      await markBunnyCleanupJobFailure(job, error.message);
    }
  }
}

export { buildStoragePathFromUrl, isRetryableBunnyStatus };
