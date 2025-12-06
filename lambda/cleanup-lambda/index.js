// Lambda handler for Cloudinary cleanup
// Triggered by EventBridge every 4 hours (configured separately)

const cloudinary = require('cloudinary').v2;

// Configure Cloudinary from env vars
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

function log(id, ...args) {
  console.log(`[cleanup-${id}]`, ...args);
}

async function listResourcesByPrefix(prefix, resourceType, ttlSeconds, runId) {
  const now = Date.now();
  let nextCursor = undefined;
  const candidates = [];

  do {
    const res = await cloudinary.api.resources({
      type: 'upload',
      resource_type: resourceType,
      prefix,
      max_results: 500,
      next_cursor: nextCursor
    });

    (res.resources || []).forEach((r) => {
      const createdAt = new Date(r.created_at).getTime();
      const ageSeconds = (now - createdAt) / 1000;
      if (ageSeconds > ttlSeconds) {
        candidates.push({
          public_id: r.public_id,
          resource_type: r.resource_type,
          secure_url: r.secure_url || null
        });
      }
    });

    nextCursor = res.next_cursor;
    log(runId, `Fetched ${candidates.length} candidates so far for type=${resourceType}, nextCursor=${nextCursor ? 'yes' : 'no'}`);
  } while (nextCursor);

  return candidates;
}

async function deleteInBatches(candidates, resourceType, runId) {
  let deleted = 0;
  let failed = 0;
  const errors = [];

  const batchSize = 100;
  for (let i = 0; i < candidates.length; i += batchSize) {
    const batch = candidates.slice(i, i + batchSize);
    const ids = batch.map((c) => c.public_id);

    log(runId, `Deleting batch ${i / batchSize + 1} (${batch.length} items) type=${resourceType}`);

    try {
      const res = await cloudinary.api.delete_resources(ids, {
        resource_type: resourceType
      });
      // Cloudinary returns per-id status; we assume success if no error thrown
      deleted += batch.length;
    } catch (err) {
      failed += batch.length;
      errors.push({
        message: err.message || 'delete_resources failed',
        resource_type: resourceType,
        batchStart: i
      });
      log(runId, 'Error deleting batch:', err);
    }
  }

  return { deleted, failed, errors };
}

async function cleanupOld({ prefix, ttlSeconds, dryRun, runId }) {
  log(runId, `Starting cleanup: prefix=${prefix}, ttlSeconds=${ttlSeconds}, dryRun=${dryRun}`);

  // List old images and raw (zips) separately
  const imageCandidates = await listResourcesByPrefix(prefix, 'image', ttlSeconds, runId);
  const rawCandidates = await listResourcesByPrefix(prefix, 'raw', ttlSeconds, runId);

  const allCandidates = [...imageCandidates, ...rawCandidates];
  log(runId, `Found ${allCandidates.length} total candidates older than TTL`);

  if (dryRun) {
    return {
      dryRun: true,
      deleted: 0,
      failed: 0,
      candidates_count: allCandidates.length,
      sample_candidates: allCandidates.slice(0, 10)
    };
  }

  // Real deletion
  const imageDelete = await deleteInBatches(imageCandidates, 'image', runId);
  const rawDelete = await deleteInBatches(rawCandidates, 'raw', runId);

  return {
    dryRun: false,
    deleted: imageDelete.deleted + rawDelete.deleted,
    failed: imageDelete.failed + rawDelete.failed,
    errors: [...imageDelete.errors, ...rawDelete.errors],
    candidates_count: allCandidates.length
  };
}

exports.handler = async (event) => {
  const runId = Date.now();
  const prefix = process.env.CLEANUP_PREFIX || 'love-u-convert';
  const ttlSeconds = Number(process.env.CLEANUP_TTL_SECONDS || '28800');
  const dryRun = event && (event.dryRun === true || event.dryRun === 'true');

  try {
    const result = await cleanupOld({ prefix, ttlSeconds, dryRun, runId });

    log(runId, 'Cleanup result:', result);
    return {
      statusCode: 200,
      body: JSON.stringify(result)
    };
  } catch (err) {
    log(runId, 'Cleanup failed:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: err.message || 'Cleanup failed'
      })
    };
  }
};

