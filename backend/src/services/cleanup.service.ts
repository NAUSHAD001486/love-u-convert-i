import cloudinary from '../config/cloudinary';

interface CleanupOptions {
  dryRun?: boolean;
  prefix?: string;
  ttlSeconds?: number;
}

interface ResourceInfo {
  public_id: string;
  resource_type: string;
  secure_url: string;
  created_at: string;
  bytes?: number;
}

interface CleanupResult {
  deleted: number;
  failed: number;
  candidates: ResourceInfo[];
  errors: string[];
  details: Array<{
    public_id: string;
    resource_type: string;
    secure_url: string;
  }>;
}

function parseCreatedAt(createdAt: string | Date): Date {
  if (createdAt instanceof Date) {
    return createdAt;
  }
  if (typeof createdAt === 'string') {
    // Cloudinary returns ISO string or timestamp
    if (createdAt.match(/^\d+$/)) {
      return new Date(parseInt(createdAt, 10) * 1000);
    }
    return new Date(createdAt);
  }
  throw new Error(`Invalid created_at format: ${createdAt}`);
}

function isResourceOlderThan(resource: any, ttlSeconds: number): boolean {
  try {
    const createdAt = parseCreatedAt(resource.created_at);
    const ageSeconds = (Date.now() - createdAt.getTime()) / 1000;
    return ageSeconds > ttlSeconds;
  } catch (error) {
    console.error(`Error parsing created_at for ${resource.public_id}:`, error);
    return false;
  }
}

async function listResourcesByPrefix(
  prefix: string,
  resourceType: 'image' | 'raw',
  ctx?: any
): Promise<ResourceInfo[]> {
  const resources: ResourceInfo[] = [];
  let nextCursor: string | undefined = undefined;
  const requestId = ctx?.requestId || 'unknown';

  do {
    try {
      const options: any = {
        type: 'upload',
        prefix: prefix,
        resource_type: resourceType,
        max_results: 500,
      };

      if (nextCursor) {
        options.next_cursor = nextCursor;
      }

      const result = await cloudinary.api.resources(options);

      if (result.resources && Array.isArray(result.resources)) {
        for (const resource of result.resources) {
          resources.push({
            public_id: resource.public_id,
            resource_type: resourceType,
            secure_url: resource.secure_url,
            created_at: resource.created_at,
            bytes: resource.bytes,
          });
        }
      }

      nextCursor = result.next_cursor;
      
      if (nextCursor) {
        console.log(`[${requestId}] Fetched ${resources.length} resources, continuing with cursor...`);
      }
    } catch (error) {
      console.error(`[${requestId}] Error listing ${resourceType} resources:`, error);
      throw error;
    }
  } while (nextCursor);

  return resources;
}

async function deleteResources(
  publicIds: string[],
  resourceType: 'image' | 'raw',
  ctx?: any
): Promise<{ deleted: number; failed: number; errors: string[] }> {
  const requestId = ctx?.requestId || 'unknown';
  let deleted = 0;
  let failed = 0;
  const errors: string[] = [];

  // Cloudinary allows up to 100 public_ids per delete call
  const batchSize = 100;
  
  for (let i = 0; i < publicIds.length; i += batchSize) {
    const batch = publicIds.slice(i, i + batchSize);
    
    try {
      const result = await cloudinary.api.delete_resources(batch, {
        resource_type: resourceType,
      });

      if (result.deleted) {
        deleted += Object.keys(result.deleted).length;
      }
      
      if (result.not_found) {
        failed += Object.keys(result.not_found).length;
        errors.push(`Not found: ${Object.keys(result.not_found).join(', ')}`);
      }
      
      if (result.errors) {
        failed += result.errors.length;
        errors.push(...result.errors.map((e: any) => e.message || String(e)));
      }

      console.log(`[${requestId}] Deleted batch ${i / batchSize + 1}: ${deleted} deleted, ${failed} failed`);
      
      // Rate limiting: wait a bit between batches
      if (i + batchSize < publicIds.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error: any) {
      failed += batch.length;
      errors.push(`Batch delete error: ${error.message || String(error)}`);
      console.error(`[${requestId}] Error deleting batch:`, error);
    }
  }

  return { deleted, failed, errors };
}

export async function cleanupOldResources(
  options: CleanupOptions = {}
): Promise<CleanupResult> {
  const {
    dryRun = true,
    prefix = 'love-u-convert',
    ttlSeconds = Number(process.env.CLEANUP_TTL_SECONDS || 28800),
  } = options;

  const ctx = options as any;
  const requestId = ctx?.requestId || 'cleanup-job';

  console.log(`[${requestId}] Starting cleanup: dryRun=${dryRun}, prefix=${prefix}, ttlSeconds=${ttlSeconds}`);

  const result: CleanupResult = {
    deleted: 0,
    failed: 0,
    candidates: [],
    errors: [],
    details: [],
  };

  try {
    // List both image and raw resources
    console.log(`[${requestId}] Listing image resources...`);
    const imageResources = await listResourcesByPrefix(prefix, 'image', ctx);
    
    console.log(`[${requestId}] Listing raw resources...`);
    const rawResources = await listResourcesByPrefix(prefix, 'raw', ctx);

    const allResources = [
      ...imageResources.map(r => ({ ...r, resource_type: 'image' })),
      ...rawResources.map(r => ({ ...r, resource_type: 'raw' })),
    ];

    console.log(`[${requestId}] Found ${allResources.length} total resources`);

    // Filter resources older than TTL
    const candidates = allResources.filter(resource =>
      isResourceOlderThan(resource, ttlSeconds)
    );

    console.log(`[${requestId}] Found ${candidates.length} resources older than ${ttlSeconds}s`);

    result.candidates = candidates;
    result.details = candidates.map(c => ({
      public_id: c.public_id,
      resource_type: c.resource_type,
      secure_url: c.secure_url,
    }));

    if (dryRun) {
      console.log(`[${requestId}] DRY RUN: Would delete ${candidates.length} resources`);
      for (const candidate of candidates) {
        const createdAt = parseCreatedAt(candidate.created_at);
        const ageSeconds = (Date.now() - createdAt.getTime()) / 1000;
        console.log(
          `[${requestId}] Would delete: ${candidate.public_id} (${candidate.resource_type}, age: ${Math.floor(ageSeconds)}s)`
        );
      }
      return result;
    }

    // Real deletion
    if (candidates.length === 0) {
      console.log(`[${requestId}] No resources to delete`);
      return result;
    }

    // Separate by resource type
    const imageIds = candidates
      .filter(c => c.resource_type === 'image')
      .map(c => c.public_id);
    
    const rawIds = candidates
      .filter(c => c.resource_type === 'raw')
      .map(c => c.public_id);

    // Delete images
    if (imageIds.length > 0) {
      console.log(`[${requestId}] Deleting ${imageIds.length} image resources...`);
      const imageResult = await deleteResources(imageIds, 'image', ctx);
      result.deleted += imageResult.deleted;
      result.failed += imageResult.failed;
      result.errors.push(...imageResult.errors);
    }

    // Delete raw files
    if (rawIds.length > 0) {
      console.log(`[${requestId}] Deleting ${rawIds.length} raw resources...`);
      const rawResult = await deleteResources(rawIds, 'raw', ctx);
      result.deleted += rawResult.deleted;
      result.failed += rawResult.failed;
      result.errors.push(...rawResult.errors);
    }

    console.log(`[${requestId}] Cleanup complete: ${result.deleted} deleted, ${result.failed} failed`);

  } catch (error: any) {
    const errorMsg = error.message || String(error);
    console.error(`[${requestId}] Cleanup error:`, errorMsg);
    result.errors.push(errorMsg);
    result.failed += result.candidates.length;
  }

  return result;
}

