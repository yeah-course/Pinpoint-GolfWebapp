

# Pinpoint Golf App — Phase 1 Implementation Plan

## Prerequisites
- **Connect Supabase** — needed for auth, database, and storage. We'll set this up first.

## Implementation Steps

### Step 1: Supabase Setup & Database Schema
Create tables via migrations:
- **profiles** (id, user_id, display_name, handicap_index, preferred_units)
- **courses** (id, name, location, created_by, created_at)
- **tee_sets** (id, course_id, name, color, course_rating, slope_rating)
- **course_holes** (id, course_id, tee_set_id, hole_number, par, yardage, stroke_index)
- **rounds** (id, user_id, course_id, tee_set_id, date_played, mode, holes_played, is_completed, total_score, is_public, notes)
- **round_holes** (id, round_id, hole_number, par, yardage, score, putts, fairway_hit, gir, penalty_strokes, scramble_attempted, scramble_converted, sand_save_attempted, sand_save_converted, tee_shot_result, approach_result)

RLS policies: users CRUD own data, courses readable by all, public rounds readable by all. Auto-create profile trigger on signup.

### Step 2: Design System & Layout Shell
- Update CSS variables for the golf-inspired palette (Masters Green primary, warm backgrounds)
- Create responsive app shell: bottom tab nav on mobile, sidebar on desktop
- Pages: Dashboard, Rounds, Courses, Profile
- Auth pages: Login, Signup

### Step 3: Authentication
- Supabase Auth with email/password
- Login & Signup pages with clean forms
- Auth context/provider with route protection
- Password reset flow with `/reset-password` page

### Step 4: Course Management
- **Course list page** with search/filter
- **Create course form**: multi-step wizard
  1. Course name + location
  2. Add tee sets (name, color, rating, slope)
  3. Enter hole data (par, yardage, stroke index) for each tee set
- Validation with zod + react-hook-form

### Step 5: Round Entry — Core UX
- **Round setup**: Select course → tee set → 9/18 → mode (Quick/Standard)
- **Hole-by-hole entry screen**:
  - Header showing hole number, par, yardage
  - Score strip: large tap buttons (1–8, +)
  - Putts strip: 0/1/2/3/4+
  - Fairway result: Fairway/Rough/Sand/Recovery/Penalty (Standard mode)
  - GIR auto-calculated, overridable
  - Penalties: 0/1/2/3
  - Progress bar, prev/next navigation
  - Auto-save on every tap via React Query mutation
- **Round completion**: summary screen with option to share

### Step 6: Dashboard & Analytics
- **Stat cards**: Score, vs Par, FIR%, GIR%, Avg Putts, Penalties, Scrambling%
- **Score trend chart** (Recharts line chart, last 20 rounds)
- **Hole scoring strip**: 18 colored circles per round
- **Recent rounds list** with tap to view detail
- **Strongest/Weakest skill** cards computed from recent data

### Step 7: Round Detail & Sharing
- Round detail page with hole-by-hole breakdown table
- Public share link (`/rounds/:id/share`) — reads `is_public` flag, no auth required
- Toggle share on/off from round detail

## Architecture

```text
src/
├── components/
│   ├── layout/        (AppShell, BottomNav, Sidebar, AuthGuard)
│   ├── rounds/        (HoleEntry, ScoreStrip, StatStrip, RoundSetup)
│   ├── courses/       (CourseForm, CourseList, CourseCard)
│   ├── dashboard/     (StatCard, ScoreTrend, HoleStrip, SkillCard)
│   └── ui/            (existing shadcn components)
├── hooks/             (useAuth, useRounds, useCourses, useProfile)
├── lib/
│   ├── supabase.ts
│   ├── stats.ts       (GIR calc, scrambling calc, aggregations)
│   └── utils.ts
├── pages/
│   ├── Dashboard.tsx
│   ├── Login.tsx / Signup.tsx / ResetPassword.tsx
│   ├── Rounds.tsx / RoundNew.tsx / RoundPlay.tsx / RoundDetail.tsx / RoundShare.tsx
│   ├── Courses.tsx / CourseNew.tsx
│   └── Profile.tsx
└── integrations/supabase/
```

## Key UX Details
- **Mobile-first**: Single column, 48px+ tap targets, bottom nav with 4 tabs (Dashboard, Rounds, Courses, Profile)
- **Desktop**: Side navigation, wider grid layouts for dashboard cards
- **Round entry**: No typing required — all taps. Every interaction auto-saves.
- **GIR formula**: `gir = (score - putts) <= (par - 2)`
- **Scrambling**: If !GIR and score ≤ par → scramble converted

## Implementation will be broken into multiple messages
Given the scale, I'll implement this across several iterations, starting with Supabase connection, schema, auth, and layout shell.

