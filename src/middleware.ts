/**
 * NextAuth.js Middleware
 *
 * Protects routes that require authentication.
 * Redirects unauthenticated users to login page.
 */

import { auth } from '@/lib/auth';

export default auth;

export const config = {
  // Protect dashboard routes
  matcher: ['/dashboard/:path*'],
};
