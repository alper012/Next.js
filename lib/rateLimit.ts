import { NextRequest, NextResponse } from "next/server";

// Helper function to get client IP
export function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const realIP = req.headers.get("x-real-ip");
  const cfConnectingIP = req.headers.get("cf-connecting-ip");

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  if (realIP) {
    return realIP;
  }
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  return "unknown";
}

// Custom rate limiting implementation
const memoryStore = new Map<string, { count: number; resetTime: number }>();

// Create a custom rate limiter
function createSimpleRateLimiter(maxRequests: number, windowMs: number) {
  return {
    limit: async (identifier: string) => {
      const now = Date.now();
      const windowStart = now - windowMs;

      if (!memoryStore.has(identifier)) {
        memoryStore.set(identifier, { count: 0, resetTime: now + windowMs });
      }

      const entry = memoryStore.get(identifier)!;

      // Reset if window has passed
      if (now > entry.resetTime) {
        entry.count = 0;
        entry.resetTime = now + windowMs;
      }

      if (entry.count >= maxRequests) {
        return {
          success: false,
          limit: maxRequests,
          remaining: 0,
          reset: entry.resetTime,
        };
      }

      entry.count++;

      return {
        success: true,
        limit: maxRequests,
        remaining: maxRequests - entry.count,
        reset: entry.resetTime,
      };
    },
  };
}

export const authLimiter = createSimpleRateLimiter(5, 15 * 60 * 1000); // 5 requests per 15 minutes
export const registrationLimiter = createSimpleRateLimiter(3, 60 * 60 * 1000); // 3 requests per hour
export const apiLimiter = createSimpleRateLimiter(100, 15 * 60 * 1000); // 100 requests per 15 minutes
export const adminLimiter = createSimpleRateLimiter(50, 15 * 60 * 1000); // 50 requests per 15 minutes

// Wrapper function to apply rate limiting to Next.js API routes
export async function withRateLimit(
  req: NextRequest,
  limiter: any,
  handler: (req: NextRequest) => Promise<NextResponse>,
  identifier?: string
): Promise<NextResponse> {
  const clientIP = getClientIP(req);
  const id = identifier || clientIP;

  try {
    // Check rate limit
    const result = await limiter.limit(id);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Too many requests. Please try again later.",
          retryAfter: Math.ceil(result.reset / 1000),
        },
        {
          status: 429,
          headers: {
            "Retry-After": Math.ceil(result.reset / 1000).toString(), // Indicates how many seconds to wait before making another request.
            "X-RateLimit-Limit": result.limit.toString(), // Shows the maximum number of requests allowed in the current time window.
            "X-RateLimit-Remaining": result.remaining.toString(), // Shows the number of requests remaining in the current time window.
            "X-RateLimit-Reset": new Date(result.reset).toISOString(), // Indicates the precise time (ISO 8601) when the rate limit will reset.
          },
        }
      );
    }

    // Add rate limit headers to successful response
    const response = await handler(req);
    response.headers.set("X-RateLimit-Limit", result.limit.toString()); // Sets the maximum number of requests allowed in the current time window.
    response.headers.set("X-RateLimit-Remaining", result.remaining.toString()); // Sets the number of requests remaining for the client in the current time window.
    response.headers.set(
      "X-RateLimit-Reset",
      new Date(result.reset).toISOString() // Sets the precise time (ISO 8601 format) when the rate limit will reset for the client.
    );

    return response;
  } catch (error) {
    console.error("Rate limiting error:", error);
    return NextResponse.json({ error: "Rate limiting error" }, { status: 500 });
  }
}
