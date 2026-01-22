# SongForge - Development Log

## Project Overview
AI Song Creation Application with Voice Cloning - Create songs in YOUR voice.

**Live URL:** https://songforge.vercel.app
**GitHub:** https://github.com/elad-refoua/songforge
**Admin Email:** eladrefoua@gmail.com

---

## Architecture

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router) |
| UI | Tailwind CSS + shadcn/ui components |
| Auth | NextAuth.js v5 (Google OAuth, JWT) |
| Database | Supabase PostgreSQL (RLS enabled) |
| Music Generation | ElevenLabs Eleven Music API |
| Lyrics Generation | Google Gemini 2.0 Flash |
| Deployment | Vercel |

---

## Environment Variables (Vercel)

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase connection URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase public anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role (bypasses RLS) |
| `AUTH_SECRET` | NextAuth.js secret for JWT signing |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `ELEVENLABS_API_KEY` | ElevenLabs API for music generation |
| `GEMINI_API_KEY` | Google Gemini API for lyrics generation |

---

## Database Schema

### Tables
- **users** - id, email, name, avatar_url, credits_balance, stripe_customer_id
- **songs** - id, user_id, title, lyrics, status, audio_url, genre, mood, language, prompt, duration_seconds, cost_credits, is_public
- **voice_profiles** - id, user_id, name, kitsai_voice_id, sample_audio_url, status, is_default
- **credit_transactions** - id, user_id, amount, balance_after, type, description, song_id
- **plans** - id, name, slug, credits_per_month, price, stripe_price_id
- **subscriptions** - id, user_id, plan_id, status, current_period_start/end
- **styles** - id, name, category, genre_tags, is_premium

### Plans (seeded)
| Plan | Price | Credits/Month |
|------|-------|--------------|
| Free | $0 | 3 |
| Starter | $9.99 | 20 |
| Creator | $24.99 | 60 |
| Pro | $49.99 | 150 |

---

## Route Structure

### Pages
| Path | Description |
|------|-------------|
| `/` | Landing page |
| `/login` | Google OAuth login |
| `/dashboard` | Main dashboard |
| `/dashboard/create` | Song creation wizard (4 steps) |
| `/dashboard/songs` | User's generated songs |
| `/dashboard/voices` | Voice cloning (placeholder) |
| `/dashboard/settings` | User settings |
| `/dashboard/settings/billing` | Plans & credits |
| `/dashboard/admin` | Admin overview (admin only) |
| `/dashboard/admin/users` | User management (admin only) |
| `/dashboard/admin/songs` | All songs overview (admin only) |

### API Routes
| Route | Method | Description |
|-------|--------|-------------|
| `/api/songs/generate` | POST | Generate song with ElevenLabs |
| `/api/lyrics/generate` | POST | Generate lyrics with Gemini AI |
| `/api/admin/stats` | GET | System statistics |
| `/api/admin/users` | GET | List all users |
| `/api/admin/users/[id]/credits` | POST | Adjust user credits |
| `/api/admin/songs` | GET | List all songs |

---

## Development History

### Session 1: Foundation Setup
- Initialized Next.js 14 project with TypeScript
- Configured Tailwind CSS and shadcn/ui
- Set up Supabase project and deployed schema
- Implemented Google OAuth with NextAuth.js v5
- Created dashboard layout with sidebar navigation
- Deployed to Vercel

### Session 2: Core Functionality
- Fixed routing issues (404 on /dashboard - was using route groups)
- Created all missing dashboard pages
- Built 4-step song creation wizard:
  - Step 1: Topic, language, purpose, important details
  - Step 2: Genre (12 options), mood (8 options), tempo (3 options)
  - Step 3: Lyrics (AI generate or write your own)
  - Step 4: Review & generate
- Created song generation API (ElevenLabs)
- Created lyrics generation API (switched from OpenAI to Gemini)
- Added ElevenLabs and Gemini API keys to Vercel
- Added lyrics hint banner on create page

### Session 3: Admin Interface
- Created admin utility (`src/lib/admin.ts`) with hardcoded admin emails
- Added `isAdmin` flag to JWT token and session
- Protected `/dashboard/admin/*` routes (middleware + API)
- Created 4 admin API routes (stats, users, credits, songs)
- Built admin overview page with stats cards and activity feed
- Built user management page with search, table, and credit adjustment dialog
- Built songs overview page with status filtering
- Added conditional admin nav item in sidebar
- Saved project documentation

---

## Admin System

### How It Works
- Admin emails defined in `src/lib/admin.ts`
- `isAdmin` boolean added to JWT token on every sign-in
- Session exposes `session.user.isAdmin` for client-side checks
- Middleware redirects non-admins from `/dashboard/admin/*`
- All admin API routes return 403 for non-admin users
- Admin queries use `getServiceSupabase()` (bypasses RLS)
- Credit adjustments create audit trail in `credit_transactions`

### Adding New Admins
Edit `src/lib/admin.ts`:
```typescript
const ADMIN_EMAILS = ['eladrefoua@gmail.com', 'new-admin@example.com'];
```

---

## Credits System

- New users get 3 free credits on signup
- Song generation costs 1 credit
- Credits can be adjusted by admin (with audit trail)
- Transaction types: bonus, subscription_grant, purchase, song_generation, refund, expiry

---

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/auth.ts` | NextAuth config, session types, route protection |
| `src/lib/admin.ts` | Admin helper (isAdmin, ADMIN_EMAILS) |
| `src/lib/db/supabase.ts` | Supabase client (anon + service role) |
| `src/lib/providers/elevenlabs.ts` | ElevenLabs music generation |
| `src/middleware.ts` | Route protection middleware |
| `src/app/dashboard/layout.tsx` | Dashboard sidebar layout |
| `src/app/dashboard/create/page.tsx` | Song creation wizard |
| `supabase/schema.sql` | Database schema |

---

## TODO / Future Work

- [ ] Stripe integration for paid plans
- [ ] Voice cloning with Kits.AI
- [ ] Song playback in dashboard
- [ ] Duet/group mode
- [ ] R2/S3 storage for audio files (currently base64)
- [ ] Rate limiting
- [ ] Usage analytics
