import { withAuth } from 'next-auth/middleware';

export default withAuth({
  pages: {
    signIn: '/login',
  },
});

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - /login
     * - /api/auth (next-auth endpoints)
     * - /api/health (health check)
     * - /dashboard/shared (public dashboards)
     * - /_next/static (static files)
     * - /_next/image (image optimization files)
     * - /favicon.ico (favicon file)
     */
    '/((?!login|api/auth|api/health|dashboard/shared|_next/static|_next/image|favicon.ico).*)',
  ],
};
