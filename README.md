# Orkly

**Orchestrate your clients' social media.**

Orkly is an open-source social media management tool built for community managers and agencies. Like a conductor with a single baton, Orkly lets you orchestrate content creation, scheduling and client management across all your accounts — all in one place.

[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-green.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg)](https://react.dev/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o--mini-purple.svg)](https://openai.com/)
[![License](https://img.shields.io/badge/License-AGPL--3.0%20%2B%20Commons%20Clause-red.svg)](#license)

---

## ✨ Features

- 🎼 **Client orchestration** — manage all your clients from a single dashboard
- 🤖 **AI Content Generation** — GPT-4o-mini rewrites your draft in 3 styles: professional, casual and viral
- 🎨 **Brand kit per client** — tone of voice and custom prompts per client
- 🔒 **Rate limiting** — daily limit per IP with in-memory fallback if Supabase is unavailable
- 🔐 **Google OAuth** — sign in with Google via Supabase Auth
- 🧪 **Tests included** — unit tests, integration tests and mocks for OpenAI/Supabase

### Coming soon
- 📅 **Post scheduling** — schedule content for a specific date, time or on a recurring basis
- 📱 **Instagram publishing** — publish photos, carousels and reels via the Meta Graph API
- 💼 **LinkedIn & Twitter/X** — multi-platform support
- 📊 **Analytics** — per-client performance tracking
- 💳 **Stripe payments** — Free, Starter, Pro and Agency plans

---

## 🚀 Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/tuusuario/orkly.git
cd orkly

# 2. Create a virtual environment
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate

# 3. Install backend dependencies
cd backend
pip install -r requirements.txt

# 4. Set up environment variables
cp .env.example .env
# Edit .env with your credentials

# 5. Start the backend
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# 6. Start the frontend (in a second terminal)
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## 📁 Project structure

```
orkly/
├── backend/
│   ├── app/
│   │   ├── admin/
│   │   │   ├── controller.py     # Admin stats endpoint
│   │   │   └── service.py        # Stats aggregation logic
│   │   ├── ai/
│   │   │   ├── service.py        # OpenAI calls
│   │   │   └── prompts.py        # AI improvement prompts
│   │   ├── auth/
│   │   │   └── dependencies.py   # JWT verification via Supabase
│   │   ├── clients/
│   │   │   ├── controller.py     # Client CRUD endpoints
│   │   │   ├── service.py        # Client business logic
│   │   │   └── schemas.py        # Client Pydantic models
│   │   ├── feedback/
│   │   │   ├── controller.py     # Feedback endpoint
│   │   │   ├── service.py        # Feedback persistence
│   │   │   └── schemas.py        # Feedback Pydantic models
│   │   ├── rate_limit/
│   │   │   ├── controller.py     # Rate limit status endpoint
│   │   │   └── service.py        # Per-IP daily rate limiting
│   │   ├── text_generation/
│   │   │   ├── controller.py     # Improve + save generation endpoints
│   │   │   ├── service.py        # Generation persistence
│   │   │   ├── schemas.py        # Generation Pydantic models
|   |   ├── storage/
|   |   |   ├── controller.py     # Handle file actions endpoints
|   |   |   ├── service.py        # File handling
|   |   |   └── schemas.py        # Files pydantic models
│   │   ├── utils/
│   │   │   └── http.py           # Shared HTTP helpers (get_user_ip)
│   │   ├── config.py             # Environment variables and clients
│   │   └── database.py           # Supabase client
│   ├── main.py                   # FastAPI entry point
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AuthModal.jsx     # Google OAuth modal
│   │   │   ├── AuthListener.jsx  # Auth state listener
│   │   │   ├── ClientCard.jsx    # Client card component
│   │   │   ├── Sidebar.jsx       # Dashboard sidebar
|   |   |   ├── FeedbackModal.jsx # Feedback modal
|   |   |   └── Button.jsx        # Button class
│   │   ├── config/
│   │   │   └── toastConfig.js    # Toast notification config
│   │   ├── pages/
│   │   │   ├── Landing.jsx       # Public landing page
│   │   │   ├── Dashboard.jsx     # Dashboard layout
│   │   │   └── clients/
│   │   │       └── Clients.jsx   # Client management view
│   │   ├── App.jsx               # Router configuration
│   │   ├── main.jsx              # React entry point
│   │   ├── index.css             # Global styles + Tailwind v4
│   │   └── supabase.js           # Supabase client
│   ├── public/
│   │   ├── orkly_icon.svg
│   │   ├── orkly_icon_sidebar.svg
│   │   └── orkly_logo.svg
│   └── package.json
├── tests/
│   ├── conftest.py
│   ├── test_ai.py
│   ├── test_config.py
│   ├── test_endpoints.py
│   ├── test_rate_limiter.py
│   └── test_schemas.py
├── pytest.ini
└── .env.example
```

---

## 💡 How it works

```
User signs in with Google OAuth
        ↓
User creates clients and sets brand voice per client
        ↓
POST /improve  →  OpenAI generates 3 variations in parallel
        ↓
User picks their favourite variation
        ↓
POST /save-generation  →  Saves original + selected variation to DB
        ↓
User publishes or schedules the content (coming soon)
```

---

## 🛠️ Tech stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI + Pydantic v2 |
| AI | OpenAI GPT-4o-mini |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth + Google OAuth |
| Frontend | React 18 + Vite + Tailwind CSS v4 |
| Tests | pytest + pytest-asyncio |
| Deploy | Google Cloud Run (backend) · Cloudflare Workers (frontend) |

---

## ⚙️ Environment variables

Copy `.env.example` to `.env` and fill in your credentials:

```env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini          # optional, default: gpt-4o-mini

SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_KEY=eyJ...               # use the service_role key

MAX_FREE_GENERATIONS_PER_DAY=5    # optional, default: 5
ADMIN_API_KEY=change-me
```

> **Important**: always use the Supabase `service_role` key in the backend, never the `anon` key. Never commit your `.env` file to Git.

---

## 🗄️ Database setup (Supabase)

Run this SQL in your Supabase **SQL Editor**:

```sql
CREATE TABLE public.profiles (
  id bigserial NOT NULL,
  user_id uuid NOT NULL,
  current_plan text NOT NULL DEFAULT 'free',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

CREATE TABLE public.clients (
  id bigserial NOT NULL,
  user_id uuid NOT NULL,
  client_name text NOT NULL,
  brand_voice text NULL,
  deleted_at timestamp with time zone NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT clients_pkey PRIMARY KEY (id),
  CONSTRAINT clients_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

CREATE TABLE public.social_accounts (
  id bigserial NOT NULL,
  platform text NOT NULL,
  username text NOT NULL,
  access_token text NOT NULL,
  token_expires_at timestamp with time zone NOT NULL,
  client_id bigint NOT NULL,
  status text NOT NULL,
  account_id text NOT NULL,
  deleted_at timestamp with time zone NULL,
  CONSTRAINT social_accounts_pkey PRIMARY KEY (id),
  CONSTRAINT social_accounts_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id)
);

CREATE TABLE public.generations (
  id bigserial NOT NULL,
  ip text NULL,
  text_original text NULL,
  text_improved text NULL,
  style text NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  client_id bigint NULL,
  CONSTRAINT generations_pkey PRIMARY KEY (id),
  CONSTRAINT generations_client_id_fkey FOREIGN KEY (client_id) REFERENCES clients(id)
);

CREATE TABLE public.rate_limits (
  id bigserial NOT NULL,
  ip text NOT NULL,
  date date NOT NULL,
  count integer NOT NULL DEFAULT 1,
  last_used_at timestamp with time zone NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  user_id uuid NULL,
  CONSTRAINT rate_limits_pkey PRIMARY KEY (id)
);

CREATE TABLE public.feedback_logs (
  id bigserial NOT NULL,
  ip text NULL,
  feedback_text text NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  user_id uuid NULL,
  CONSTRAINT feedback_logs_pkey PRIMARY KEY (id)
);
```

Enable RLS and add policies for `clients` and `social_accounts` so users can only access their own data.

---

## 🧪 Tests

```bash
# Run all tests
pytest

# Verbose output
pytest --tb=short -v

# Single module
pytest tests/test_endpoints.py -v
```

Tests mock OpenAI and Supabase completely — no real credentials needed.

---

## 🌐 API endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `GET`  | `/` | — | API info |
| `GET`  | `/health` | — | Health check |
| `POST` | `/improve` | — | Improve a post (3 variations) |
| `POST` | `/save-generation` | — | Save selected generation to DB |
| `GET`  | `/rate-limit/status` | — | Current rate limit status |
| `POST` | `/feedback` | — | Submit feedback |
| `GET`  | `/clients` | JWT | List user's clients |
| `POST` | `/clients` | JWT | Create a client |
| `PUT`  | `/clients/{id}` | JWT | Update a client |
| `DELETE` | `/clients/{id}` | JWT | Soft delete a client |
| `GET`  | `/admin/stats` | API Key | Usage statistics |

Interactive docs available at `http://localhost:8000/docs`.

---

## 🚢 Deploy

The backend runs on **Google Cloud Run** and the frontend as a **Cloudflare Worker** with CI/CD via GitHub Actions.

### Backend — Google Cloud Run

```bash
# 1. Authenticate
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# 2. Enable services (first time only)
gcloud services enable run.googleapis.com cloudbuild.googleapis.com

# 3. Build and push
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/orkly-backend

# 4. Deploy
gcloud run deploy orkly-backend \
  --image gcr.io/YOUR_PROJECT_ID/orkly-backend \
  --platform managed \
  --region europe-west1 \
  --allow-unauthenticated
```

#### GitHub Actions secrets

| Secret | Description |
|--------|-------------|
| `GCP_CREDENTIALS` | GCP service account JSON |
| `OPENAI_API_KEY` | Your OpenAI API key |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_KEY` | Supabase service_role key |

### Frontend — Cloudflare Workers

```bash
cd frontend
npm run build
wrangler deploy
```

---

## 🗺️ Roadmap

### ✅ Phase 1 — MVP
- [x] FastAPI backend + OpenAI
- [x] 3 improvement styles (professional, casual, viral)
- [x] 8 visual themes
- [x] Browser-side image generation with html2canvas
- [x] IP rate limiting with in-memory fallback
- [x] Unit and integration tests
- [x] Light / dark mode frontend
- [x] Auto-updating footer year

### 🚧 Phase 2 — Authentication & client management
- [x] Google OAuth login (Supabase Auth)
- [x] Client dashboard — manage all clients from one place
- [x] Brand kit per client — tone of voice, custom prompt, examples
- [x] Generation history per client
- [x] Personal account settings

### 📝 Phase 3 — AI content features
- [x] Platform-specific generation — Instagram, LinkedIn, TikTok each get tailored output
- [x] Custom tones per client — brand voice used automatically in every generation
- [ ] Hashtag recommendations per post and platform
- [ ] Content repurposing — paste a long text, get posts for every platform
- [ ] Carousel generation — structured slide-by-slide content for Instagram
- [ ] Branding extractor — extract logos, colors and typography from a client's website

### 📋 Phase 4 — Social publishing
- [ ] Instagram publishing (Meta Graph API) — photos, carousels, reels
- [ ] LinkedIn publishing
- [ ] Twitter / X publishing (API cost: ~$100/mo — charged as €5/mo add-on)
- [ ] Multiple social accounts per client

### 📅 Phase 5 — Scheduling & calendar
- [ ] Schedule posts for a specific date and time
- [ ] Recurring posts
- [ ] AI-powered content calendar — suggest a full week of content per client

### 🗂️ Phase 6 — Client file storage
- [x] Cloud media library per client — store logos, images, videos and brand assets (Cloudflare R2)
- [ ] Share folders with clients — controlled access per folder
- [ ] Approval workflow — review and approve content before it goes live
- [ ] Post preview — show exactly how the post will look on each platform
- [ ] Image auto-resize — automatically adapt images to each platform's specs
- [ ] Video validation — check video specs before publishing (length, size, format)

#### Nice to have
- [ ] Post templates — save frequently used formats per client or platform
- [ ] Bulk scheduling — upload and schedule multiple posts at once
- [ ] Canva integration — import designs directly from Canva
- [ ] Per-client analytics — impressions, clicks and performance per client

### 💳 Phase 7 — Monetisation
- [ ] Stripe integration — subscriptions + webhooks
- [ ] Subscription enforcement — plan limits applied per endpoint (clients, generations, storage)
- [ ] Plans:
  - Free — 3 clients, 30 generations/month, no storage, no image generation
  - Solo — €18.99/mo or €161.99/year (~29% off) — 15 clients, 300 gen/month, 5GB storage, 20 AI images/month
  - Pro — €33.99/mo or €288.99/year (~29% off) — unlimited clients, unlimited gen, 50GB storage, 50 AI images/month
  - Agency — €63.99/mo or €543.99/year (~29% off) — everything in Pro + seats + publishing + 200GB storage + 100 AI images/month
  - Twitter/X publishing — €5/mo add-on (API cost pass-through)
- [x] Donations via Buy Me a Coffee

---

## 🤝 Contributing

Contributions are welcome. Please:

1. Open an issue before starting a large change
2. Fork the repo and create a branch: `git checkout -b feature/my-feature`
3. Make sure tests pass: `pytest`
4. Open a Pull Request describing the change

> **License note**: by contributing you agree your code is distributed under the same terms as this project (AGPL-3.0 + Commons Clause). The project can be used freely for non-commercial purposes, but **cannot be used to offer a paid service** without explicit permission from the author.

---

## 📄 License

Copyright © 2026 Jorge Vinagre

Licensed under **GNU AGPLv3 with Commons Clause**.

| Can I...? | |
|-----------|---|
| View and study the code | ✅ |
| Modify and improve it | ✅ |
| Use it for personal projects | ✅ |
| Distribute modified versions | ✅ same license |
| Offer it as a paid SaaS | ❌ without permission |
| Sell or sublicense it | ❌ without permission |

For commercial licensing: [jorgecdev444@gmail.com](mailto:jorgecdev444@gmail.com)

---

## ⚠️ Legal notice

Orkly uses the OpenAI API. Users must comply with [OpenAI's usage policies](https://openai.com/policies). The author is not responsible for content generated by users.

Privacy Policy and Terms of Service available at [orkly.app/privacy](https://orkly.app/privacy) and [orkly.app/terms](https://orkly.app/terms).

---

## 📞 Contact

- 📧 [jorgecdev444@gmail.com](mailto:jorgecdev444@gmail.com)
- 🐦 [@vinagre444](https://x.com/jorgecdev444)

---

**Built for the community manager and agency community ❤️**