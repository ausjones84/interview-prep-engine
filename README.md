# Interview Prep Engine

> Built by Austin "Big Aus" Jones — Cloud Engineer | MrCeesAI | TechPassport App

AI-powered interview prep that turns your resume + a job description into a personalized study guide with audio playback and live mock interview practice. Built for cloud engineers, tech roles, and anyone who needs to walk into an interview ready.

## What It Does

1. **Upload your resume** (PDF/DOCX) — one time, saved for all roles
2. **Paste a job description** OR enter a job title + company
3. **Claude generates** in ~45 seconds:
   - Role overview (what the job actually is)
   - Acronyms cheat sheet (every buzzword from the JD explained)
   - Top 20 likely interview questions with model answers
   - 10 STAR scenarios pulled from YOUR actual resume
   - 30-min and 60-min study formats
4. **One tap → ElevenLabs** converts to audio MP3 saved to your library
5. **Listen at the gym**, in the car, anywhere — with background playback
6. **Mock Interview mode** → Claude asks questions live, you respond, it grades you (1-10) with feedback
7. **Combine Multiple Roles** → prep for 3 companies at once with a unified guide

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS + Framer Motion |
| AI (Study Guide + Mock Interview) | Anthropic Claude Sonnet 4.5 |
| Text-to-Speech | ElevenLabs |
| Database + Storage | Supabase (Postgres + Storage for MP3s) |
| Deployment | Vercel |
| Mobile | PWA (install to home screen) |

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Home dashboard (role list)
│   ├── new-role/page.tsx           # Create new role + generate guide
│   ├── role/
│   │   └── [id]/
│   │       ├── page.tsx            # Study guide viewer
│   │       ├── audio/page.tsx      # Audio library player
│   │       ├── mock/page.tsx       # Mock interview mode
│   │       └── combine/page.tsx    # Combine multiple roles
│   └── api/
│       ├── roles/route.ts          # CRUD for roles
│       ├── roles/[id]/route.ts     # Single role operations
│       ├── generate-guide/route.ts # Claude study guide generation
│       ├── generate-audio/route.ts # ElevenLabs TTS
│       ├── mock-interview/route.ts # Mock interview + grading
│       ├── combine-roles/route.ts  # Multi-role unified guide
│       └── parse-resume/route.ts   # PDF/DOCX text extraction
├── lib/
│   ├── supabase.ts                 # Supabase client
│   └── claude.ts                  # Claude AI helpers
└── types/
    └── index.ts                    # TypeScript interfaces
```

## Setup (15 minutes)

### 1. Clone and Install

```bash
git clone https://github.com/ausjones84/interview-prep-engine.git
cd interview-prep-engine
npm install
```

### 2. Create Accounts (all free to start)

- **Anthropic API key**: https://console.anthropic.com
- **ElevenLabs API key**: https://elevenlabs.io ($5/mo Starter plan)
- **Supabase project**: https://supabase.com (free tier)
- **Vercel account**: https://vercel.com (free tier)

### 3. Supabase Setup

In your Supabase project, go to **SQL Editor** and run the contents of `supabase-schema.sql`.

Then go to **Storage → Create bucket → name it `audio` → make it Public**.

### 4. Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```bash
cp .env.example .env.local
```

```env
ANTHROPIC_API_KEY=sk-ant-...
ELEVENLABS_API_KEY=your-key
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 5. Run Locally

```bash
npm run dev
```

Open http://localhost:3000

### 6. Deploy to Vercel

```bash
npm i -g vercel
vercel
```

Add the same env vars in the Vercel dashboard. Done.

### 7. Install on Your Phone

Open the deployed URL on your iPhone/Android → **Share → Add to Home Screen**. Now it's a real app.

## Daily Use

1. Open app on phone
2. Tap **"New Role"**
3. Upload resume (one time — it's saved)
4. Paste job description or type `"Senior Cloud Engineer at Anata"`
5. Wait ~45 seconds for guide + audio
6. Hit play and head to the gym
7. Before the interview, hit **"Mock Interview"** and run through 5-10 questions

## Multi-Role Prep (Unique Feature)

Interviewing at multiple companies at once? Use **Combine Roles**:

1. Add each role you're prepping for
2. On any role page, tap **"Combine Roles"**
3. Select all active roles
4. Claude builds ONE unified guide that:
   - Identifies overlapping skills across all roles
   - Creates shared STAR scenarios that work for any company
   - Shows you what to prioritize based on overlap
   - Notes key differences between roles

## Cost Estimate

| Service | Monthly Cost |
|---------|-------------|
| ElevenLabs Starter | $5/mo |
| Claude API | ~$2-5/mo (heavy use) |
| Supabase | Free tier |
| Vercel | Free tier |
| **Total** | **~$7-10/mo** |

## Features Roadmap

- [ ] Voice input for mock interview (speak your answers)
- [ ] Spaced repetition flashcard mode
- [ ] Share study guide with a friend
- [ ] Interview day countdown + notifications
- [ ] Company research AI summary
- [ ] Salary negotiation prep module

---

Built with ❤️ by Austin "Big Aus" Jones  
[MrCeesAI](https://mrceesai.com) | TechPassport App
