# API Response Examples

## Single File Conversion Response

```json
{
  "status": "success",
  "mode": "single",
  "downloadUrl": "https://res.cloudinary.com/dyntgql7u/image/upload/v1764996000/love-u-convert/device-1764996000-abc123.png",
  "meta": {
    "originalName": "test.webp",
    "convertedName": "love-u-convert/device-1764996000-abc123",
    "convertedSizeBytes": 123456
  }
}
```

## Multi-File (ZIP) Conversion Response

```json
{
  "status": "success",
  "mode": "multi",
  "zipUrl": "https://res.cloudinary.com/dyntgql7u/raw/upload/v1764996000/love-u-convert/zip-1764996000-xyz789.zip",
  "meta": {
    "totalFiles": 3
  }
}
```

## Error Response (Rate Limit)

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_PER_SECOND",
    "message": "Max 5 files/sec exceeded",
    "retryAfterMs": 200
  }
}
```

## Error Response (Daily Quota)

```json
{
  "success": false,
  "error": {
    "code": "DAILY_LIMIT_REACHED",
    "message": "Daily 1.5GB limit reached",
    "quota": 1610612736
  }
}
```

