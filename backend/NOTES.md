# Backend Notes

## Cloudinary Cleanup Job

The cleanup service removes old Cloudinary resources based on TTL (Time To Live).

### Configuration

Set environment variable:
- `CLEANUP_TTL_SECONDS` - Default: 28800 (8 hours)

### Manual Run

#### Dry Run (Preview)
```bash
# Build TypeScript first
npm run build

# Run dry run
node scripts/run_cleanup.js --dry

# With custom prefix
node scripts/run_cleanup.js --dry --prefix=love-u-convert/test

# With custom TTL (1 hour = 3600 seconds)
node scripts/run_cleanup.js --dry --ttl=3600
```

#### Real Deletion
```bash
# Build first
npm run build

# Real run
node scripts/run_cleanup.js --dry=false

# With options
node scripts/run_cleanup.js --dry=false --prefix=love-u-convert/test --ttl=3600
```

### Scheduling Options

#### AWS Lambda + EventBridge (Recommended)

1. Create Lambda function with Node.js runtime
2. Package the built `dist/` folder and dependencies
3. Set environment variables in Lambda:
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
   - `CLEANUP_TTL_SECONDS` (optional)
4. Create EventBridge rule to trigger daily:
   ```json
   {
     "ScheduleExpression": "cron(0 2 * * ? *)"
   }
   ```
   (Runs daily at 2 AM UTC)

5. Lambda handler:
   ```javascript
   exports.handler = async (event) => {
     require('dotenv').config();
     const { cleanupOldResources } = require('./dist/services/cleanup.service');
     
     const result = await cleanupOldResources({
       dryRun: false,
       prefix: 'love-u-convert',
       ttlSeconds: Number(process.env.CLEANUP_TTL_SECONDS || 28800),
       requestId: `lambda-${Date.now()}`,
     });
     
     return {
       statusCode: 200,
       body: JSON.stringify(result),
     };
   };
   ```

#### Elastic Beanstalk Worker Cron (Alternative)

1. Create `.ebextensions/cleanup.config`:
   ```yaml
   files:
     "/etc/cron.d/cleanup-cloudinary":
       mode: "000644"
       owner: root
       group: root
       content: |
         0 2 * * * cd /var/app/current && node scripts/run_cleanup.js --dry=false
   ```

2. Deploy to Elastic Beanstalk worker environment

#### Local Cron (Development)

Add to crontab:
```bash
0 2 * * * cd /path/to/backend && npm run build && node scripts/run_cleanup.js --dry=false
```

### Output Format

The cleanup script outputs JSON to stdout:
```json
{
  "deleted": 10,
  "failed": 0,
  "candidates": [...],
  "errors": [],
  "details": [
    {
      "public_id": "love-u-convert/file_abc123",
      "resource_type": "image",
      "secure_url": "https://..."
    }
  ]
}
```

