import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// List of routes that do NOT require authentication
const PUBLIC_PATHS = ["/signin", "/api", "/_next", "/favicon.ico", "/assets"];

// Use the manual cookie name set with js-cookie in your sign-in page
const ACCESS_COOKIE_NAME = "sb-access-token";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Get the user's session from cookies (manual cookie name)
  const accessToken = request.cookies.get(ACCESS_COOKIE_NAME)?.value;

  // If no session, redirect to signin
  if (!accessToken) {
    const url = request.nextUrl.clone();
    url.pathname = "/signin";
    return NextResponse.redirect(url);
  }

  // Check user role
  // Use current request origin to avoid relying on NEXT_PUBLIC_SITE_URL.
  const checkRoleUrl = new URL("/api/check-role", request.url);
  try {
    const response = await fetch(checkRoleUrl, {
      headers: { Cookie: request.headers.get("cookie") || "" },
      cache: "no-store",
    });

    // Explicit unauthorized/forbidden -> send back to signin
    if (response.status === 401 || response.status === 403) {
      const url = request.nextUrl.clone();
      url.pathname = "/signin";
      return NextResponse.redirect(url);
    }

    // If role endpoint itself errors (500), do not hard-lock user in a redirect loop.
    if (response.ok) {
      const data = await response.json();
      const role = data?.role ?? null;
      if (!["admin", "staff"].includes(role)) {
        const url = request.nextUrl.clone();
        url.pathname = "/signin";
        return NextResponse.redirect(url);
      }
    }
  } catch {
    // If internal role check request fails unexpectedly, allow request through
    // so the app can surface a proper UI error instead of an infinite redirect.
    return NextResponse.next();
  }

  return NextResponse.next();
}

// Apply middleware to all routes except public ones
export const config = {
  matcher: [
    /*
      Match all routes except:
      - /signin
      - /api/*
      - /_next/*
      - /favicon.ico
      - /assets/*
    */
    "/((?!signin|api|_next|favicon.ico|assets).*)",
  ],
};
