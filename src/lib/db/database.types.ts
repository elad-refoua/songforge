/**
 * Supabase Database Types
 *
 * These types are generated from the database schema.
 * Run `npx supabase gen types typescript` to regenerate.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          avatar_url: string | null;
          credits_balance: number;
          stripe_customer_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name?: string | null;
          avatar_url?: string | null;
          credits_balance?: number;
          stripe_customer_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          avatar_url?: string | null;
          credits_balance?: number;
          stripe_customer_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      voice_profiles: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          kitsai_voice_id: string | null;
          sample_audio_url: string;
          thumbnail_url: string | null;
          status: 'pending' | 'processing' | 'ready' | 'failed';
          is_default: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          kitsai_voice_id?: string | null;
          sample_audio_url: string;
          thumbnail_url?: string | null;
          status?: 'pending' | 'processing' | 'ready' | 'failed';
          is_default?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          kitsai_voice_id?: string | null;
          sample_audio_url?: string;
          thumbnail_url?: string | null;
          status?: 'pending' | 'processing' | 'ready' | 'failed';
          is_default?: boolean;
          created_at?: string;
        };
      };
      songs: {
        Row: {
          id: string;
          user_id: string;
          title: string | null;
          lyrics: string | null;
          style_id: string | null;
          prompt: string | null;
          song_mode: 'ai_lyrics' | 'collaborative' | 'instrumental';
          voice_mode: 'single' | 'duet' | 'group' | 'ai_default';
          audio_url: string | null;
          instrumental_url: string | null;
          original_vocals_url: string | null;
          duration_seconds: number | null;
          cost_credits: number;
          status: 'pending' | 'generating_music' | 'extracting_stems' | 'converting_voice' | 'merging' | 'completed' | 'failed';
          error_message: string | null;
          metadata: Json;
          is_public: boolean;
          play_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string | null;
          lyrics?: string | null;
          style_id?: string | null;
          prompt?: string | null;
          song_mode: 'ai_lyrics' | 'collaborative' | 'instrumental';
          voice_mode?: 'single' | 'duet' | 'group' | 'ai_default';
          audio_url?: string | null;
          instrumental_url?: string | null;
          original_vocals_url?: string | null;
          duration_seconds?: number | null;
          cost_credits?: number;
          status?: 'pending' | 'generating_music' | 'extracting_stems' | 'converting_voice' | 'merging' | 'completed' | 'failed';
          error_message?: string | null;
          metadata?: Json;
          is_public?: boolean;
          play_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string | null;
          lyrics?: string | null;
          style_id?: string | null;
          prompt?: string | null;
          song_mode?: 'ai_lyrics' | 'collaborative' | 'instrumental';
          voice_mode?: 'single' | 'duet' | 'group' | 'ai_default';
          audio_url?: string | null;
          instrumental_url?: string | null;
          original_vocals_url?: string | null;
          duration_seconds?: number | null;
          cost_credits?: number;
          status?: 'pending' | 'generating_music' | 'extracting_stems' | 'converting_voice' | 'merging' | 'completed' | 'failed';
          error_message?: string | null;
          metadata?: Json;
          is_public?: boolean;
          play_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      song_voice_assignments: {
        Row: {
          id: string;
          song_id: string;
          voice_profile_id: string;
          section_type: 'verse1' | 'verse2' | 'chorus' | 'bridge' | 'all';
          layer: 'lead' | 'harmony' | 'backing';
          created_at: string;
        };
        Insert: {
          id?: string;
          song_id: string;
          voice_profile_id: string;
          section_type: 'verse1' | 'verse2' | 'chorus' | 'bridge' | 'all';
          layer?: 'lead' | 'harmony' | 'backing';
          created_at?: string;
        };
        Update: {
          id?: string;
          song_id?: string;
          voice_profile_id?: string;
          section_type?: 'verse1' | 'verse2' | 'chorus' | 'bridge' | 'all';
          layer?: 'lead' | 'harmony' | 'backing';
          created_at?: string;
        };
      };
      styles: {
        Row: {
          id: string;
          name: string;
          category: string;
          description: string | null;
          genre_tags: string[];
          example_audio_url: string | null;
          thumbnail_url: string | null;
          is_active: boolean;
          is_premium: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category: string;
          description?: string | null;
          genre_tags: string[];
          example_audio_url?: string | null;
          thumbnail_url?: string | null;
          is_active?: boolean;
          is_premium?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          category?: string;
          description?: string | null;
          genre_tags?: string[];
          example_audio_url?: string | null;
          thumbnail_url?: string | null;
          is_active?: boolean;
          is_premium?: boolean;
          sort_order?: number;
          created_at?: string;
        };
      };
      plans: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          credits_per_month: number;
          price_monthly_cents: number;
          price_yearly_cents: number | null;
          stripe_price_id_monthly: string | null;
          stripe_price_id_yearly: string | null;
          max_voice_profiles: number;
          can_duet: boolean;
          can_group: boolean;
          features: Json;
          is_active: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          credits_per_month: number;
          price_monthly_cents: number;
          price_yearly_cents?: number | null;
          stripe_price_id_monthly?: string | null;
          stripe_price_id_yearly?: string | null;
          max_voice_profiles?: number;
          can_duet?: boolean;
          can_group?: boolean;
          features?: Json;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          credits_per_month?: number;
          price_monthly_cents?: number;
          price_yearly_cents?: number | null;
          stripe_price_id_monthly?: string | null;
          stripe_price_id_yearly?: string | null;
          max_voice_profiles?: number;
          can_duet?: boolean;
          can_group?: boolean;
          features?: Json;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan_id: string;
          stripe_subscription_id: string | null;
          status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';
          current_period_start: string;
          current_period_end: string;
          cancel_at_period_end: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan_id: string;
          stripe_subscription_id?: string | null;
          status?: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';
          current_period_start: string;
          current_period_end: string;
          cancel_at_period_end?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          plan_id?: string;
          stripe_subscription_id?: string | null;
          status?: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';
          current_period_start?: string;
          current_period_end?: string;
          cancel_at_period_end?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      credit_transactions: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          balance_after: number;
          type: 'subscription_grant' | 'purchase' | 'song_generation' | 'refund' | 'bonus' | 'expiry';
          description: string | null;
          song_id: string | null;
          stripe_payment_intent_id: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount: number;
          balance_after: number;
          type: 'subscription_grant' | 'purchase' | 'song_generation' | 'refund' | 'bonus' | 'expiry';
          description?: string | null;
          song_id?: string | null;
          stripe_payment_intent_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          amount?: number;
          balance_after?: number;
          type?: 'subscription_grant' | 'purchase' | 'song_generation' | 'refund' | 'bonus' | 'expiry';
          description?: string | null;
          song_id?: string | null;
          stripe_payment_intent_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      voice_status: 'pending' | 'processing' | 'ready' | 'failed';
      song_status: 'pending' | 'generating_music' | 'extracting_stems' | 'converting_voice' | 'merging' | 'completed' | 'failed';
      song_mode: 'ai_lyrics' | 'collaborative' | 'instrumental';
      voice_mode: 'single' | 'duet' | 'group' | 'ai_default';
      section_type: 'verse1' | 'verse2' | 'chorus' | 'bridge' | 'all';
      voice_layer: 'lead' | 'harmony' | 'backing';
      subscription_status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';
      credit_transaction_type: 'subscription_grant' | 'purchase' | 'song_generation' | 'refund' | 'bonus' | 'expiry';
    };
  };
}
