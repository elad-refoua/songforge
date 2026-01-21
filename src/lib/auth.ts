/**
 * NextAuth.js Configuration
 *
 * Handles authentication with Google OAuth and email magic links.
 * Integrates with Supabase for user storage.
 */

import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { getServiceSupabase } from '@/lib/db/supabase';
import type { NextAuthConfig } from 'next-auth';
import { v4 as uuidv4 } from 'uuid';
import type { Database } from '@/lib/db/database.types';

// Type aliases for Supabase inserts
type UserInsert = Database['public']['Tables']['users']['Insert'];
type CreditTransactionInsert = Database['public']['Tables']['credit_transactions']['Insert'];

// Extend the built-in session types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      creditsBalance: number;
    };
  }

  interface User {
    creditsBalance?: number;
  }
}

export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    }),
  ],

  pages: {
    signIn: '/login',
    signOut: '/login',
    error: '/login',
    newUser: '/dashboard',
  },

  callbacks: {
    /**
     * Called when a user signs in
     * Create or update the user in Supabase
     */
    async signIn({ user, account }) {
      if (!user.email) return false;

      try {
        const supabase = getServiceSupabase();

        // Check if user exists
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('email', user.email)
          .single();

        if (!existingUser) {
          // Generate a UUID for the user if not provided
          const userId = user.id || uuidv4();

          // Create new user with 3 free credits
          const newUser: UserInsert = {
            id: userId,
            email: user.email,
            name: user.name || null,
            avatar_url: user.image || null,
            credits_balance: 3, // Free credits for new users
          };
          const { error } = await supabase.from('users').insert(newUser);

          if (error) {
            console.error('Error creating user:', error);
            return false;
          }

          // Log the bonus credit transaction
          const creditTransaction: CreditTransactionInsert = {
            user_id: userId,
            amount: 3,
            balance_after: 3,
            type: 'bonus',
            description: 'Welcome bonus - 3 free credits',
          };
          await supabase.from('credit_transactions').insert(creditTransaction);
        } else {
          // Update existing user's info
          await supabase
            .from('users')
            .update({
              name: user.name || undefined,
              avatar_url: user.image || undefined,
            })
            .eq('id', existingUser.id);
        }

        return true;
      } catch (error) {
        console.error('SignIn error:', error);
        return false;
      }
    },

    /**
     * Called whenever a JWT is created or updated
     */
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
      }

      // Refresh user data on session update
      if (trigger === 'update' || trigger === 'signIn') {
        try {
          const supabase = getServiceSupabase();
          const { data } = await supabase
            .from('users')
            .select('credits_balance')
            .eq('email', token.email)
            .single();

          if (data) {
            token.creditsBalance = data.credits_balance;
          }
        } catch (error) {
          console.error('JWT callback error:', error);
        }
      }

      return token;
    },

    /**
     * Called whenever a session is checked
     */
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.creditsBalance = (token.creditsBalance as number) || 0;
      }
      return session;
    },

    /**
     * Control who can access protected routes
     */
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
      const isOnAuth = nextUrl.pathname.startsWith('/login') || nextUrl.pathname.startsWith('/signup');

      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false; // Redirect to login
      } else if (isOnAuth) {
        if (isLoggedIn) {
          return Response.redirect(new URL('/dashboard', nextUrl));
        }
      }

      return true;
    },
  },

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  trustHost: true,
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
