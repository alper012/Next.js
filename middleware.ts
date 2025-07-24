import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getClientIP, createRateLimiter } from "./lib/rateLimit";

// Create a general API rate limiter
const generalLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 requests per window
  message: "Too many requests from this IP, please try again later.",
});

export function middleware(request: NextRequest) {
  // Only apply to API routes
  if (request.nextUrl.pathname.startsWith("/api/")) {
    const clientIP = getClientIP(request);

    // Skip rate limiting for NextAuth routes (they handle their own)
    if (request.nextUrl.pathname.startsWith("/api/auth/")) {
      return NextResponse.next();
    }

    // Apply rate limiting to all other API routes
    return generalLimiter.store
      .incr(clientIP)
      .then((result: any) => {
        if (result.remainingPoints < 0) {
          return NextResponse.json(
            { error: generalLimiter.message },
            { status: 429 }
          );
        }

        const response = NextResponse.next();
        response.headers.set(
          "X-RateLimit-Limit",
          generalLimiter.max.toString()
        );
        response.headers.set(
          "X-RateLimit-Remaining",
          result.remainingPoints.toString()
        );
        response.headers.set(
          "X-RateLimit-Reset",
          result.resetTime.toISOString()
        );

        return response;
      })
      .catch(() => {
        return NextResponse.next();
      });
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
