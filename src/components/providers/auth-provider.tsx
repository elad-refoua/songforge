'use client';

/**
 * Auth Provider
 *
 * Wraps the app with NextAuth.js SessionProvider
 * for client-side session management.
 */

import { SessionProvider } from 'next-auth/react';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
