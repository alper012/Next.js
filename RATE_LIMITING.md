# Rate Limiting Implementation

This project now includes comprehensive rate limiting to protect against abuse and ensure fair usage of the API.

## Overview

Rate limiting has been implemented at multiple levels:

1. **Global API Rate Limiting** - Applied to all API routes via middleware
2. **Specific Endpoint Rate Limiting** - Custom limits for sensitive endpoints
3. **Authentication Rate Limiting** - Protection against brute force attacks

## Rate Limit Configurations

### Global API Rate Limiting

- **Window**: 15 minutes
- **Limit**: 200 requests per IP
- **Applied to**: All API routes (except NextAuth routes)

### Authentication Endpoints

- **Window**: 15 minutes
- **Limit**: 5 attempts per IP
- **Applied to**:
  - `/api/auth/forgot-password`
  - `/api/auth/reset-password`

### Registration Endpoint

- **Window**: 1 hour
- **Limit**: 3 registrations per IP
- **Applied to**: `/api/auth/register`

### Admin Endpoints

- **Window**: 15 minutes
- **Limit**: 50 requests per IP
- **Applied to**:
  - `/api/admin/pending-users`
  - `/api/admin/all-users`
  - `/api/admin/users`

### General API Endpoints

- **Window**: 15 minutes
- **Limit**: 100 requests per IP
- **Applied to**:
  - `/api/quiz-attempts`
  - Other API endpoints

## Implementation Details

### Rate Limiting Store

- Currently uses in-memory storage (Map)
- **For production**: Consider using Redis or a persistent store
- Data is lost on server restart

### Client IP Detection

The system detects client IPs from various headers:

- `x-forwarded-for`
- `x-real-ip`
- `cf-connecting-ip` (Cloudflare)

### Response Headers

Rate-limited responses include these headers:

- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: When the rate limit resets

## Error Responses

When rate limits are exceeded, the API returns:

```json
{
  "error": "Too many requests from this IP, please try again later."
}
```

With HTTP status code `429` (Too Many Requests).

## Production Considerations

### 1. Persistent Storage

For production, replace the in-memory store with Redis:

```typescript
// Example Redis implementation
import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL);

const redisStore = {
  incr: async (key: string) => {
    const count = await redis.incr(key);
    await redis.expire(key, windowMs / 1000);
    return { totalHits: count, remainingPoints: max - count };
  },
};
```

### 2. Environment-Specific Limits

Consider different limits for different environments:

- Development: Higher limits for testing
- Production: Stricter limits for security
- Staging: Moderate limits

### 3. Monitoring

Add monitoring for rate limit violations:

- Log rate limit hits
- Alert on unusual patterns
- Track IP addresses that frequently hit limits

### 4. Whitelisting

Consider whitelisting certain IPs (e.g., your own services):

```typescript
const whitelistedIPs = ["127.0.0.1", "::1"];
if (whitelistedIPs.includes(clientIP)) {
  return NextResponse.next();
}
```

## Testing Rate Limits

You can test rate limiting by making rapid requests to any API endpoint. After hitting the limit, you'll receive a 429 response.

## Security Benefits

1. **Prevents Brute Force Attacks**: Limits login attempts
2. **Prevents Spam**: Limits registration attempts
3. **Protects Resources**: Prevents API abuse
4. **Fair Usage**: Ensures all users have equal access
5. **DDoS Protection**: Basic protection against simple attacks

## Future Enhancements

1. **User-based Rate Limiting**: Limit per user instead of just IP
2. **Dynamic Limits**: Adjust limits based on user behavior
3. **Rate Limit Analytics**: Track and analyze rate limit usage
4. **Advanced Whitelisting**: Whitelist trusted IPs or users
5. **Rate Limit Bypass**: Allow certain users to bypass limits
