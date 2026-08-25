# LOOP — AI Customer-Feedback Intelligence Platform

A working, corporate-grade implementation of the Zidio "Project LOOP" brief,
built with **Python** end-to-end (FastAPI, not Next.js — see *Stack note* below)
so it can be run and edited entirely from VS Code with no Node.js toolchain.

LOOP ingests multi-channel customer feedback, uses Claude to classify and
cluster it, tracks trends, answers plain-English questions grounded in real
feedback, and generates Voice-of-Customer reports — while enforcing strict
multi-tenant isolation and role-based access control.

## Stack note

The brief's reference stack is Next.js/TypeScript. This build intentionally
re-implements the **exact same architecture, data model, features, and
acceptance criteria** using an all-Python stack instead, per your request:

| Layer | Brief's stack | This build |
|---|---|---|
| Framework | Next.js 14 App Router | **FastAPI** (Python 3.11+) |
| Templating/UI | React Server/Client Components | **Jinja2 server-rendered HTML** + Tailwind (CDN) + vanilla JS |
| ORM | Prisma | **SQLAlchemy** |
| Database | PostgreSQL | **SQLite by default**, PostgreSQL via `DATABASE_URL` (Neon/Supabase — zero code changes) |
| Auth | NextAuth | **Signed session cookies** (itsdangerous) + Argon2 password hashing |
| AI | Anthropic Claude API | **Anthropic Claude API** (`anthropic` Python SDK) |
| Embeddings/search | pgvector / hosted embeddings | **TF-IDF cosine similarity** (scikit-learn) — a dependency-free stand-in for "Ask LOOP" retrieval; swap `retrieve_relevant_feedback()` in `app/ai.py` for real embeddings without touching any route code |
| Charts | Recharts | **Chart.js** (CDN) |
| Validation | Zod | **Pydantic** |
| Deployment | Vercel | Any Python host (Render, Railway, Fly.io) — see *Deployment* below |

Every feature, milestone, and acceptance criterion from the brief (Sections
04, 08, 11) is implemented. All AI features also have a **rule-based offline
fallback** so the whole app is fully demoable even with no Claude API key set.

## Features implemented

**Core**
- Multi-tenant workspaces with 3 roles: Admin / Analyst / Viewer, enforced
  server-side on every route (not just hidden buttons — verified: a Viewer
  gets a real `403` trying to create feedback).
- Every query is scoped by `workspace_id` — one tenant can never read another
  tenant's rows, even by guessing an ID in the URL.
- Feedback ingestion: single-entry form, CSV bulk upload (with an
  imported/failed summary), and simulated channel buttons.
- Feedback inbox: server-side pagination, full-text search, filters
  (channel/sentiment/theme/status/date), inline status workflow
  (NEW → REVIEWED → ACTIONED).
- Analytics dashboard: stat cards + 3 live charts (volume over time,
  sentiment breakdown, top themes).

**AI (Claude-powered, Section 08)**
- **AI1 — Auto-classification**: every item is sent to Claude and returns
  strict structured JSON (sentiment, score, themes, feature area), validated
  and cached on the record. Manual "re-classify" action included.
- **AI2 — Theme clustering & trends**: feedback is grouped into named,
  reused themes; a trends view charts weekly volume per theme and flags
  themes spiking ≥50% week-over-week; click-through drill-down to the
  underlying feedback.
- **AI3 — Ask LOOP**: retrieval-then-answer. TF-IDF search finds the most
  relevant feedback, which is passed to Claude with an explicit
  "answer only from this context" instruction; answers cite the specific
  items used.
- **AI4 — Voice-of-Customer report**: stats (top themes, sentiment deltas,
  representative quotes) are pre-computed in code — Claude only writes the
  narrative around real numbers, so it can't hallucinate figures. Reports
  are saved, viewable later, and exportable as PDF.

## Project structure

```
loop/
  app/
    main.py            # FastAPI app, routing, error pages
    database.py         # SQLAlchemy engine/session
    models.py            # Workspace, User, Feedback, Theme, FeedbackTheme, Report
    schemas.py           # Pydantic request schemas
    auth.py               # password hashing, session cookies, RBAC guards
    ai.py                   # ALL Claude API calls live here (classify, ask, report)
    seed.py                  # demo workspace + 3 users + 140 classified feedback items
    utils.py                  # templates, CSV parsing, stats helpers
    routers/
      auth_routes.py          # signup, login, logout, member management
      feedback_routes.py       # ingestion, inbox, status workflow
      dashboard_routes.py       # stat cards + chart JSON APIs
      themes_routes.py           # trends + drill-down APIs
      insights_routes.py          # Ask LOOP
      reports_routes.py            # VoC report generation + PDF export
  templates/                        # Jinja2 (Tailwind CDN + Chart.js CDN)
  static/css, static/js
  requirements.txt
  .env.example
```

## Local setup (VS Code)

### 1. Prerequisites
- Python 3.11+ and Git
- (Optional) An Anthropic API key — the app runs fully offline without one,
  using rule-based fallbacks for every AI feature.

### 2. Install & configure
```bash
cd loop
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate

pip install -r requirements.txt

cp .env.example .env
# Edit .env: set ANTHROPIC_API_KEY to enable real AI features (optional)
```

### 3. Initialize the database and seed demo data
```bash
python -m app.seed
```
This creates `loop.db` (SQLite) with one demo workspace, 3 role-based users,
140 classified feedback items, and 8 themes.

### 4. Run it
```bash
uvicorn app.main:app --reload
```
Open **http://localhost:8000** — you'll be redirected to `/login`.

### Demo credentials (workspace: "Northwind Analytics")
All three share the password `Password123!`:

| Role | Email |
|---|---|
| Admin | `admin@demo.loop` |
| Analyst | `analyst@demo.loop` |
| Viewer | `viewer@demo.loop` |

Or click **"Create a workspace"** on the login page to sign up fresh — the
first user in a new workspace automatically becomes Admin.

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | No | Defaults to local SQLite. Set to a Postgres URL (Neon/Supabase) for production. |
| `SECRET_KEY` | Yes (prod) | Signs session cookies. Generate with `python -c "import secrets; print(secrets.token_hex(32))"`. |
| `ANTHROPIC_API_KEY` | No | Enables real Claude-powered classification/Q&A/reports. Falls back to rule-based logic if unset. |
| `ANTHROPIC_MODEL` | No | Defaults to `claude-sonnet-4-6`. |

**Never commit `.env`.** It's already in `.gitignore`.

## Switching to PostgreSQL

No code changes needed — just set `DATABASE_URL`, e.g.:
```
DATABASE_URL=postgresql+psycopg2://user:password@host:5432/loop
```
and `pip install psycopg2-binary`, then re-run `python -m app.seed`.

## Deployment

Any Python host works (Render, Railway, Fly.io). General shape:
1. Push this repo to GitHub.
2. Create a Postgres database (Neon/Supabase free tier) and set `DATABASE_URL`.
3. Set `SECRET_KEY` and `ANTHROPIC_API_KEY` as environment variables on the host.
4. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
5. Run `python -m app.seed` once against the production database (or sign up
   fresh through `/signup`).

## Architecture summary

Three-tier, matching the brief's non-negotiable security rule: the browser
only ever talks to LOOP's own route handlers; only the route handlers talk
to the database (via SQLAlchemy, always filtered by `workspace_id`) and to
the Claude API (server-side only, key never touches the browser). AI
features follow retrieve-then-answer (Ask LOOP) or compute-then-narrate
(VoC report) patterns specifically to prevent hallucination.

## Known simplifications (documented, not hidden)

- **Retrieval** uses TF-IDF cosine similarity instead of a hosted embeddings
  provider / pgvector, so "Ask LOOP" works with zero external dependencies.
  Swapping in real embeddings only requires changing
  `retrieve_relevant_feedback()` in `app/ai.py`.
- **PDF export** uses `fpdf2` with the built-in Helvetica font (Latin-1);
  non-Latin characters in AI narratives are transliterated to the nearest
  ASCII equivalent.
- Simulated channels (Section 04 scope) generate a small fixed sample per
  click rather than pulling from a live third-party API, per the brief's
  explicit "out of scope" list.

## Originality

Every line here was generated for this specific brief — the feature set,
data model, and prompt designs are not copy-pasted from a template.
