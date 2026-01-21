// ============================================
// USER TYPES
// ============================================

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  creditsBalance: number;
  stripeCustomerId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// VOICE PROFILE TYPES
// ============================================

export type VoiceStatus = 'pending' | 'processing' | 'ready' | 'failed';

export interface VoiceProfile {
  id: string;
  userId: string;
  name: string;
  kitsaiVoiceId: string | null;
  sampleAudioUrl: string;
  thumbnailUrl: string | null;
  status: VoiceStatus;
  isDefault: boolean;
  createdAt: Date;
}

export interface CreateVoiceProfileInput {
  name: string;
  sampleAudio: File | Blob;
}

// ============================================
// SONG TYPES
// ============================================

export type SongStatus = 'pending' | 'generating_music' | 'extracting_stems' | 'converting_voice' | 'merging' | 'completed' | 'failed';
export type SongMode = 'ai_lyrics' | 'collaborative' | 'instrumental';
export type VoiceMode = 'single' | 'duet' | 'group' | 'ai_default';

export interface Song {
  id: string;
  userId: string;
  title: string | null;
  lyrics: string | null;
  styleId: string | null;
  prompt: string | null;
  songMode: SongMode;
  voiceMode: VoiceMode;
  audioUrl: string | null;
  instrumentalUrl: string | null;
  originalVocalsUrl: string | null;
  durationSeconds: number | null;
  costCredits: number;
  status: SongStatus;
  errorMessage: string | null;
  metadata: Record<string, unknown>;
  isPublic: boolean;
  playCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSongInput {
  mode: SongMode;
  styleId?: string;
  customTags?: string[];
  prompt?: string;
  lyrics?: string;
  title?: string;
  voiceMode?: VoiceMode;
  voiceProfileIds?: string[];
  isInstrumental?: boolean;
}

export interface SongVoiceAssignment {
  id: string;
  songId: string;
  voiceProfileId: string;
  sectionType: 'verse1' | 'verse2' | 'chorus' | 'bridge' | 'all';
  layer: 'lead' | 'harmony' | 'backing';
}

// ============================================
// STYLE TYPES
// ============================================

export interface Style {
  id: string;
  name: string;
  category: string;
  description: string | null;
  genreTags: string[];
  exampleAudioUrl: string | null;
  thumbnailUrl: string | null;
  isActive: boolean;
  isPremium: boolean;
  sortOrder: number;
}

export interface StyleCategory {
  name: string;
  styles: Style[];
}

// ============================================
// PLAN & SUBSCRIPTION TYPES
// ============================================

export interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  creditsPerMonth: number;
  priceMonthly: number; // in cents
  priceYearly: number | null;
  stripePriceIdMonthly: string | null;
  stripePriceIdYearly: string | null;
  maxVoiceProfiles: number;
  canDuet: boolean;
  canGroup: boolean;
  features: string[];
  isActive: boolean;
}

export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  stripeSubscriptionId: string | null;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
}

// ============================================
// CREDIT TYPES
// ============================================

export type CreditTransactionType =
  | 'subscription_grant'
  | 'purchase'
  | 'song_generation'
  | 'refund'
  | 'bonus'
  | 'expiry';

export interface CreditTransaction {
  id: string;
  userId: string;
  amount: number; // positive = credit, negative = debit
  balanceAfter: number;
  type: CreditTransactionType;
  description: string | null;
  songId: string | null;
  stripePaymentIntentId: string | null;
  createdAt: Date;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ============================================
// SONG GENERATION EVENTS (SSE)
// ============================================

export type SongEventType =
  | 'queued'
  | 'generating_music'
  | 'extracting_stems'
  | 'converting_voice'
  | 'merging'
  | 'progress'
  | 'completed'
  | 'failed';

export interface SongStatusEvent {
  type: SongEventType;
  songId: string;
  status: SongStatus;
  progress?: number; // 0-100
  message?: string;
  song?: Song;
  error?: string;
}

// ============================================
// ELEVENLABS API TYPES
// ============================================

export interface ElevenLabsGenerateParams {
  prompt?: string;
  compositionPlan?: ElevenLabsCompositionPlan;
  musicLengthMs?: number;
  forceInstrumental?: boolean;
  outputFormat?: string;
}

export interface ElevenLabsCompositionPlan {
  globalStyles?: {
    positive?: string[];
    negative?: string[];
  };
  sections?: ElevenLabsSection[];
}

export interface ElevenLabsSection {
  type: string;
  durationMs: number;
  lyrics?: string;
  styles?: {
    positive?: string[];
    negative?: string[];
  };
}

export interface ElevenLabsStems {
  vocals: ArrayBuffer;
  instrumental: ArrayBuffer;
}

// ============================================
// KITS.AI API TYPES
// ============================================

export interface KitsAIVoiceCloneResult {
  voiceId: string;
  name: string;
  status: 'ready' | 'processing' | 'failed';
}

export interface KitsAIConversionParams {
  audio: ArrayBuffer;
  voiceId: string;
  pitchShift?: number;
}

// ============================================
// LYRICS GENERATION TYPES
// ============================================

export interface GenerateLyricsInput {
  prompt: string;
  styleId?: string;
  structure?: 'verse-chorus' | 'verse-only' | 'freeform';
  mood?: string;
  language?: string;
}

export interface GeneratedLyrics {
  title: string;
  lyrics: string;
  sections: LyricsSection[];
  suggestions?: string[];
}

export interface LyricsSection {
  type: 'verse' | 'chorus' | 'bridge' | 'outro' | 'intro';
  content: string;
  lineCount: number;
}
