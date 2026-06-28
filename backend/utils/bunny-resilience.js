import pool from './db-client.js';

let hasEnsuredBunnyResilience = false;

export async function ensureBunnyResilienceSchema() {
  if (hasEnsuredBunnyResilience) {
    return;
  }

  await pool.query(`
    ALTER TABLE batch_content
    ADD COLUMN IF NOT EXISTS bunny_sync_error_count INTEGER DEFAULT 0
  `);
  await pool.query(`
    ALTER TABLE batch_content
    ADD COLUMN IF NOT EXISTS bunny_last_sync_error TEXT
  `);
  await pool.query(`
    ALTER TABLE batch_content
    ADD COLUMN IF NOT EXISTS bunny_last_sync_attempt_at TIMESTAMP
  `);
  await pool.query(`
    ALTER TABLE batch_content
    ADD COLUMN IF NOT EXISTS bunny_next_sync_attempt_at TIMESTAMP
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS bunny_cleanup_jobs (
      id SERIAL PRIMARY KEY,
      content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('video', 'note')),
      target_key TEXT NOT NULL,
      original_content_id INTEGER,
      attempts INTEGER DEFAULT 0,
      last_error TEXT,
      next_attempt_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  hasEnsuredBunnyResilience = true;
}

export function getNextBunnyRetryDate(errorCount) {
  const nextCount = Math.max(1, Number(errorCount) || 1);
  const backoffMinutes = Math.min(60, [1, 2, 5, 10, 20, 30, 60][Math.min(nextCount - 1, 6)]);
  return new Date(Date.now() + backoffMinutes * 60 * 1000);
}

export async function shouldSkipBunnySync(row) {
  await ensureBunnyResilienceSchema();

  if (!row?.bunny_next_sync_attempt_at) {
    return false;
  }

  return new Date(row.bunny_next_sync_attempt_at).getTime() > Date.now();
}

export async function markBunnySyncSuccess(rowId, nextFields = {}) {
  await ensureBunnyResilienceSchema();

  const keys = Object.keys(nextFields);
  const assignments = [
    `bunny_sync_error_count = 0`,
    `bunny_last_sync_error = NULL`,
    `bunny_last_sync_attempt_at = CURRENT_TIMESTAMP`,
    `bunny_next_sync_attempt_at = NULL`,
    `updated_at = CURRENT_TIMESTAMP`
  ];
  const values = [rowId];

  keys.forEach((key, index) => {
    assignments.push(`${key} = $${index + 2}`);
    values.push(nextFields[key]);
  });

  const result = await pool.query(
    `UPDATE batch_content
     SET ${assignments.join(', ')}
     WHERE id = $1
     RETURNING *`,
    values
  );

  return result.rows[0] || null;
}

export async function markBunnySyncFailure(row, errorMessage) {
  await ensureBunnyResilienceSchema();

  const nextErrorCount = Number(row?.bunny_sync_error_count || 0) + 1;
  const nextAttemptAt = getNextBunnyRetryDate(nextErrorCount);

  const result = await pool.query(
    `UPDATE batch_content
     SET bunny_sync_error_count = $2,
         bunny_last_sync_error = $3,
         bunny_last_sync_attempt_at = CURRENT_TIMESTAMP,
         bunny_next_sync_attempt_at = $4,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $1
     RETURNING *`,
    [row.id, nextErrorCount, errorMessage, nextAttemptAt]
  );

  return result.rows[0] || { ...row, bunny_sync_error_count: nextErrorCount, bunny_last_sync_error: errorMessage };
}

export async function enqueueBunnyCleanupJob({ contentType, targetKey, originalContentId, errorMessage }) {
  await ensureBunnyResilienceSchema();

  const existing = await pool.query(
    `SELECT id
     FROM bunny_cleanup_jobs
     WHERE content_type = $1 AND target_key = $2
     LIMIT 1`,
    [contentType, targetKey]
  );

  if (existing.rows.length > 0) {
    await pool.query(
      `UPDATE bunny_cleanup_jobs
       SET last_error = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [existing.rows[0].id, errorMessage || null]
    );
    return existing.rows[0].id;
  }

  const result = await pool.query(
    `INSERT INTO bunny_cleanup_jobs (content_type, target_key, original_content_id, last_error)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [contentType, targetKey, originalContentId || null, errorMessage || null]
  );

  return result.rows[0]?.id || null;
}

export async function claimPendingBunnyCleanupJobs(limit = 5) {
  await ensureBunnyResilienceSchema();

  const result = await pool.query(
    `SELECT *
     FROM bunny_cleanup_jobs
     WHERE next_attempt_at <= CURRENT_TIMESTAMP
     ORDER BY next_attempt_at ASC, id ASC
     LIMIT $1`,
    [limit]
  );

  return result.rows;
}

export async function markBunnyCleanupJobSuccess(jobId) {
  await ensureBunnyResilienceSchema();
  await pool.query('DELETE FROM bunny_cleanup_jobs WHERE id = $1', [jobId]);
}

export async function markBunnyCleanupJobFailure(job, errorMessage) {
  await ensureBunnyResilienceSchema();

  const nextAttempts = Number(job?.attempts || 0) + 1;
  const nextAttemptAt = getNextBunnyRetryDate(nextAttempts);

  await pool.query(
    `UPDATE bunny_cleanup_jobs
     SET attempts = $2,
         last_error = $3,
         next_attempt_at = $4,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $1`,
    [job.id, nextAttempts, errorMessage, nextAttemptAt]
  );
}
