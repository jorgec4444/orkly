# Postly

**Publish faster. Manage better.**

Postly is an open-source social media management tool for community managers and agencies. Create AI-powered content, schedule posts, and manage multiple client accounts — all in one place.

[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-green.svg)](https://fastapi.tiangolo.com/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o--mini-purple.svg)](https://openai.com/)
[![License](https://img.shields.io/badge/License-AGPL--3.0%20%2B%20Commons%20Clause-red.svg)](#license)

---

## ✨ Features

- 🤖 **AI Content Generation** — GPT-4o-mini rewrites your draft in 3 styles: professional, casual and viral
- 📸 **Image Generation** — capture your post as a shareable PNG directly in the browser (no server needed)
- 🎨 **8 visual themes** — light, dark, gradient, sunset, ocean, forest, fire, midnight
- 🔒 **Rate limiting** — daily limit per IP with in-memory fallback if Supabase is unavailable
- 🧪 **Tests included** — unit tests, integration tests and mocks for OpenAI/Supabase

### Coming soon
- 📅 **Post scheduling** — schedule content for a specific date, time or on a recurring basis
- 📱 **Instagram publishing** — publish photos, carousels and reels via the Meta Graph API
- 💼 **LinkedIn & Twitter/X** — multi-platform support
- 👥 **Multiple accounts** — manage several client profiles from a single dashboard
- 💳 **Stripe payments** — Free, Pro and Agency plans

---

## 🚀 Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/tuusuario/postly.git
cd postly

# 2. Create a virtual environment
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Set up environment variables
cp .env.example .env
# Edit .env with your credentials

# 5. Start the backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# 6. Serve the frontend (in a second terminal)
cd frontend && python -m http.server 3000
```

Open **http://localhost:3000** in your browser.

---

## 📁 Project structure

```
postly/
├── app/
│   ├── __init__.py
│   ├── ai.py           # OpenAI calls
│   ├── config.py       # Environment variables and clients
│   ├── database.py     # Supabase client
│   ├── feedback.py     # Feedback persistence
│   ├── prompts.py      # AI improvement prompts
│   ├── rate_limiter.py # Daily IP rate limiting + analytics
│   └── schemas.py      # Pydantic models
├── frontend/
│   ├── index.html
│   └── main.js
├── tests/
│   ├── conftest.py
│   ├── test_ai.py
│   ├── test_config.py
│   ├── test_endpoints.py
│   ├── test_rate_limiter.py
│   └── test_schemas.py
├── main.py             # FastAPI entry point
├── requirements.txt
├── pytest.ini
└── .env.example
```

---

## 💡 How it works

```
User writes a draft
        ↓
POST /improve  →  OpenAI generates 3 variations in parallel
        ↓
User picks their favourite
        ↓
html2canvas captures the styled card as PNG in the browser
        ↓
User downloads or shares the image
```

---

## 🛠️ Tech stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI + Pydantic v2 |
| AI | OpenAI GPT-4o-mini |
| Database | Supabase (PostgreSQL) |
| Image generation | html2canvas (browser-side) |
| Frontend | HTML + CSS + Vanilla JS |
| Tests | pytest + pytest-asyncio |
| Deploy | Railway (backend) · any static host (frontend) |

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
create table rate_limits (
  id           bigserial primary key,
  ip           text not null,
  date         date not null,
  count        int  not null default 1,
  last_used_at timestamptz,
  created_at   timestamptz default now(),
  unique(ip, date)
);

create table generations (
  id             bigserial primary key,
  ip             text,
  tweet_original text,
  tweet_improved text,
  style          text,
  created_at     timestamptz default now()
);

create table feedback_logs (
  id            bigserial primary key,
  ip            text,
  feedback_text text,
  created_at    timestamptz default now()
);
```

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

| Method | Route | Description |
|--------|-------|-------------|
| `GET`  | `/` | API info |
| `GET`  | `/health` | Health check |
| `POST` | `/improve` | Improve a post (3 variations) |
| `GET`  | `/rate-limit/status` | Current rate limit status |
| `POST` | `/feedback` | Submit feedback |
| `GET`  | `/admin/stats?api_key=` | Usage statistics (protected) |

Interactive docs available at `http://localhost:8000/docs`.

---

## 🚢 Deploy on Railway

1. Push the project to GitHub
2. Connect the repo on [railway.app](https://railway.app)
3. Add the environment variables from `.env.example` in the Railway dashboard
4. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Update `API_URL` in `frontend/main.js` with the URL Railway assigns you

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

### 🚧 Phase 2 — Authentication
- [ ] User accounts (Supabase Auth)
- [ ] Personal dashboard
- [ ] Generation history

### 📋 Phase 3 — Social publishing
- [ ] Instagram publishing (Meta Graph API) — photos, carousels, reels
- [ ] Twitter / X publishing
- [ ] LinkedIn publishing
- [ ] Multiple client account management

### 📅 Phase 4 — Scheduling
- [ ] Schedule posts for a specific date and time
- [ ] Recurring posts
- [ ] Content calendar view

### 💳 Phase 5 — Monetisation
- [ ] Stripe integration
- [ ] Plans: Free (5/day), Pro (unlimited, €15/mo), Agency (multi-account, €39/mo)
- [ ] Video support (Pro feature)

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

Copyright © 2025 Jorge Vinagre

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

Full license text in [`LICENSE`](./LICENSE).

---

## ⚠️ Legal notice

Postly uses the OpenAI API. Users must comply with [OpenAI's usage policies](https://openai.com/policies). The author is not responsible for content generated by users.

---

## 📞 Contact

- 📧 [jorgecdev444@gmail.com](mailto:jorgecdev444@gmail.com)
- 🐦 [@vinagre444](https://x.com/vinagre444)
- 💬 [Discord](https://discord.gg/fxJXWPF5)

---

**Built for the creator and agency community ❤️**
