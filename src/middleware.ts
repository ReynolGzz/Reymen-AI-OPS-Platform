import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/forgot-password");
  const isAdminRoute = pathname.startsWith("/admin");
  const isPortalRoute = pathname.startsWith("/portal");
  const isWebhookRoute = pathname.startsWith("/api/webhooks");
  const isAuthApiRoute = pathname.startsWith("/api/auth");

  // Public routes
  if (isAuthPage || isWebhookRoute || isAuthApiRoute) return NextResponse.next();

  // No session → redirect to login
  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const role = session.user.role;

  // Admin routes require SUPER_ADMIN or ADMIN
  if (isAdminRoute && role !== "SUPER_ADMIN" && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/portal/dashboard", req.url));
  }

  // Portal routes require an organization
  if (isPortalRoute && !session.user.organizationId) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
