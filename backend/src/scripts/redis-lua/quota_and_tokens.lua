-- Keys: tokensKey, quotaKey
-- ARGV: nowMillis, requestedFiles, requestBytes, capacity, refillPerMs, dailyBytesLimit, quotaTtlSeconds
local tokensKey = KEYS[1]
local quotaKey = KEYS[2]
local nowMillis = tonumber(ARGV[1])
local requestedFiles = tonumber(ARGV[2])
local requestBytes = tonumber(ARGV[3])
local capacity = tonumber(ARGV[4])
local refillPerMs = tonumber(ARGV[5])
local dailyBytesLimit = tonumber(ARGV[6])
local quotaTtlSeconds = tonumber(ARGV[7])

-- Read tokens and lastRefill from hash
local tokensData = redis.call("HGETALL", tokensKey)
local tokens = capacity
local lastRefill = nowMillis

if #tokensData > 0 then
  for i = 1, #tokensData, 2 do
    if tokensData[i] == "tokens" then
      tokens = tonumber(tokensData[i + 1]) or capacity
    elseif tokensData[i] == "lastRefill" then
      lastRefill = tonumber(tokensData[i + 1]) or nowMillis
    end
  end
end

-- Compute token refill
local delta = nowMillis - lastRefill
if delta < 0 then
  delta = 0
end
local add = math.floor(delta * refillPerMs)
local newTokens = math.min(capacity, tokens + add)

-- Check if enough tokens for requested files
if newTokens < requestedFiles then
  return cjson.encode({"RATE_LIMIT_EXCEEDED", newTokens})
end

-- Increment quota
local newQuota = redis.call("INCRBY", quotaKey, requestBytes)

-- Set TTL on quota key if not already set
if redis.call("TTL", quotaKey) == -1 then
  redis.call("EXPIRE", quotaKey, quotaTtlSeconds)
end

-- Check daily limit
if newQuota > dailyBytesLimit then
  -- Revert the quota increment (since tokens not consumed yet)
  redis.call("INCRBY", quotaKey, -requestBytes)
  return cjson.encode({"DAILY_LIMIT_EXCEEDED", newQuota - requestBytes})
end

-- Consume tokens and update
local tokensAfter = newTokens - requestedFiles

-- Update tokens hash
redis.call("HSET", tokensKey, "tokens", tokensAfter)
redis.call("HSET", tokensKey, "lastRefill", nowMillis)

-- Set TTL on tokens key (same as quota)
if redis.call("TTL", tokensKey) == -1 then
  redis.call("EXPIRE", tokensKey, quotaTtlSeconds)
end

return cjson.encode({"OK", tokensAfter, newQuota})
