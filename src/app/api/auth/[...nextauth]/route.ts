/**
 * NextAuth.js API Route Handler
 *
 * Handles all authentication API requests:
 * - GET /api/auth/signin
 * - GET /api/auth/signout
 * - GET /api/auth/session
 * - POST /api/auth/callback/:provider
 */

import { handlers } from '@/lib/auth';

export const { GET, POST } = handlers;
