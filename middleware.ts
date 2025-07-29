import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getClientIP, apiLimiter } from "./lib/rateLimit";

export function middleware(request: NextRequest) {
  // Only apply to API routes
  if (request.nextUrl.pathname.startsWith("/api/")) {
    const clientIP = getClientIP(request);

    // Skip rate limiting for NextAuth routes (they handle their own)
    if (request.nextUrl.pathname.startsWith("/api/auth/")) {
      return NextResponse.next();
    }

    // Apply rate limiting to all other API routes
    return apiLimiter
      .limit(clientIP)
      .then((result: any) => {
        if (!result.success) {
          return NextResponse.json(
            {
              error: "Too many requests from this IP, please try again later.",
            },
            { status: 429 }
          );
        }

        const response = NextResponse.next();
        response.headers.set("X-RateLimit-Limit", result.limit.toString());
        response.headers.set(
          "X-RateLimit-Remaining",
          result.remaining.toString()
        );
        response.headers.set(
          "X-RateLimit-Reset",
          new Date(result.reset).toISOString()
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
