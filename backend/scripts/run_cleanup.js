#!/usr/bin/env node

require('dotenv').config();

const { cleanupOldResources } = require('../dist/services/cleanup.service');

// Parse CLI arguments
const args = process.argv.slice(2);
let dryRun = true;
let prefix = 'love-u-convert';
let ttlSeconds = Number(process.env.CLEANUP_TTL_SECONDS || 28800);

for (const arg of args) {
  if (arg === '--dry=false' || arg === '--dry=0' || arg === '--no-dry') {
    dryRun = false;
  } else if (arg === '--dry' || arg === '--dry=true' || arg === '--dry=1') {
    dryRun = true;
  } else if (arg.startsWith('--prefix=')) {
    prefix = arg.split('=')[1];
  } else if (arg.startsWith('--ttl=')) {
    ttlSeconds = Number(arg.split('=')[1]);
  }
}

async function main() {
  try {
    const result = await cleanupOldResources({
      dryRun,
      prefix,
      ttlSeconds,
      requestId: `cleanup-${Date.now()}`,
    });

    // Print JSON report to stdout (logs go to stderr)
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
    
    process.exit(result.failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('Cleanup failed:', error);
    process.exit(1);
  }
}

main();

