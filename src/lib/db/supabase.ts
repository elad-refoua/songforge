/**
 * Supabase Client Configuration
 *
 * Provides both client-side and server-side Supabase clients.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// Environment variables (may be undefined during build)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Lazy-initialized clients
let _supabase: SupabaseClient<Database> | null = null;
let _serviceSupabase: SupabaseClient<Database> | null = null;

/**
 * Client-side Supabase client
 * Uses the anon key with Row Level Security (RLS)
 */
export function getSupabase(): SupabaseClient<Database> {
  if (!_supabase) {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables');
    }
    _supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });
  }
  return _supabase;
}

// For backwards compatibility
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : null as unknown as SupabaseClient<Database>;

/**
 * Server-side Supabase client with service role
 * Bypasses RLS - use only in secure server contexts
 */
export function getServiceSupabase(): SupabaseClient<Database> {
  if (!_serviceSupabase) {
    if (!supabaseUrl) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set');
    }
    if (!supabaseServiceRoleKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
    }
    _serviceSupabase = createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return _serviceSupabase;
}

/**
 * Create a Supabase client for server components
 * Uses the anon key but in a server context
 */
export function createServerClient(): SupabaseClient<Database> {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
