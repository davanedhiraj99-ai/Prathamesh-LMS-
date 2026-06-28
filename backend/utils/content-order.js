import pool from './db-client.js';

let hasEnsuredSortOrderColumn = false;

export async function ensureBatchContentOrderColumn() {
  if (hasEnsuredSortOrderColumn) {
    return;
  }

  await pool.query(`
    ALTER TABLE batch_content
    ADD COLUMN IF NOT EXISTS sort_order INTEGER
  `);

  hasEnsuredSortOrderColumn = true;
}

export async function normalizeBatchContentOrder(batchId, type) {
  await ensureBatchContentOrderColumn();

  const result = await pool.query(
    `SELECT id, sort_order
     FROM batch_content
     WHERE batch_id = $1 AND type = $2
     ORDER BY COALESCE(sort_order, 2147483647), created_at ASC, id ASC`,
    [batchId, type]
  );

  for (const [index, row] of result.rows.entries()) {
    const nextSortOrder = index + 1;
    if (row.sort_order !== nextSortOrder) {
      await pool.query(
        `UPDATE batch_content
         SET sort_order = $2,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [row.id, nextSortOrder]
      );
    }
  }
}

export async function getBatchContentInsertOrder(batchId, type, placement, positionInput) {
  await normalizeBatchContentOrder(batchId, type);

  const countResult = await pool.query(
    `SELECT COUNT(*)::int AS total
     FROM batch_content
     WHERE batch_id = $1 AND type = $2`,
    [batchId, type]
  );

  const total = countResult.rows[0]?.total || 0;

  if (placement === 'first') {
    return 1;
  }

  if (placement === 'number') {
    const parsed = Number(positionInput);
    const safePosition = Number.isInteger(parsed) ? parsed : total + 1;
    return Math.min(Math.max(safePosition, 1), total + 1);
  }

  return total + 1;
}

export async function shiftBatchContentOrder(batchId, type, fromOrder) {
  await ensureBatchContentOrderColumn();

  await pool.query(
    `UPDATE batch_content
     SET sort_order = sort_order + 1,
         updated_at = CURRENT_TIMESTAMP
     WHERE batch_id = $1
       AND type = $2
       AND sort_order >= $3`,
    [batchId, type, fromOrder]
  );
}
