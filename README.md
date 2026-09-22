# Compass

Turn any learning goal into a personalized **Study Guide**.

Describe your destination, and Compass writes a clear, ordered plan with the right topics, resources, and projects at each step.

- **Guide-first** — a written, structured study guide you can check off phase by phase.
- **Ask follow-ups** — streaming chat about your generated guide: explain concepts, adjust pacing, suggest practice.
- **Personalized by default** — the model classifies your level, goal type, depth, and domain, then folds it into generation.
- **Light/dark theme** — toggle persists in `localStorage`.

## Quick Start

```bash
pnpm install
cp .env.example .env
# add your API key to .env (see Provider Modes below)
pnpm dev
```

Open `http://localhost:3000`, click "Get started", and generate your guide.

## How It Works

1. **Describe your goal** — tell Compass what you want to learn and where you're starting.
2. **Get your guide** — Compass writes a personalized, ordered study plan (phases, topics, labeled resources).
3. **Learn in order** — check off phases, track your progress, and ask the chat follow-up questions as you go.

## Pages

| Route | Purpose |
|-------|---------|
| `/` | Landing — hero + CTA |
| `/guide` | Study guide with sidebar history + chat |
| `/why` | Why Compass (feature overview) |
| `/how` | How it works |

## API

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/guide` | POST | Generates a study guide from `{ goal }` |
| `/api/chat` | POST | Streams a chat reply (SSE) given `{ goal, guide, messages }` |

`/api/chat` requires `PROVIDER=openrouter`; it returns `500` when no chat provider is configured (e.g. mock mode).

## Provider Modes

Set `PROVIDER` in `.env` to choose how guides are generated:

| Mode | `PROVIDER` | What it does | Cost |
|------|-----------|--------------|------|
| **OpenRouter** | `openrouter` | Generates a full guide + enables streaming chat (best quality) | ~$0.001/guide |
| **Mock** | `mock` | Deterministic generic scaffold; chat disabled | Free |

### OpenRouter (recommended)

Uses a generative LLM to produce a complete, specific study guide tailored to your goal, and powers the guide chat.

```env
PROVIDER=openrouter
OPENROUTER_API_KEY=sk-or-...
OPENROUTER_GUIDE_MODEL=nvidia/nemotron-3-super-120b-a12b:free  # default
```

The model is configurable via `OPENROUTER_GUIDE_MODEL` (falls back to `OPENROUTER_MODEL`, then the default).

Optional web search (used by both guide generation and chat):

```env
WEB_SEARCH=true
WEB_SEARCH_MAX_RESULTS=5
```

### Mock

No API key needed. Returns a fixed 3-phase scaffold with a note explaining how to enable real generation. Chat endpoints return `Chat provider not configured`.

```env
PROVIDER=mock
```

## Architecture

```
app/
  page.tsx                 # Landing page
  guide/page.tsx           # Study guide view
  why/page.tsx             # Why Compass
  how/page.tsx             # How it works
  api/guide/route.ts       # POST — generates guides (mock fallback inline)
  api/chat/route.ts        # POST — streams chat replies (SSE)
src/
  domain/
    guide/schemas.ts       # StudyGuide type + Zod schema (incl. optional profile)
    chat/schemas.ts        # Chat request/message schemas
  providers/
    guide-generator.ts     # GuideGenerator interface
    chat-client.ts         # ChatClient interface
    provider-factory.ts    # Builds OpenRouter clients from config
    openrouter/            # Generative LLM via OpenRouter API (guide + chat)
  infrastructure/config.ts # Config loader (provider, models, web search)
  ui/
    guide/                 # GuideView, history, markdown, SSE stream parsing, serialize
    landing/               # Landing shell + shared content
    theme/                 # Light/dark theme toggle
tests/                     # Vitest unit tests
```

### Guide Output

A study guide is a validated, structured JSON object:

```
{ intro, prerequisites?, phases, milestones, profile? }
```

Each phase has a `id`, `title`, `duration`, markdown `body`, and optional `resources` (kinds: `Course`, `Reading`, `Exercise`, `Project`, `Case Study`, `Certification`, `Tool`, `Docs`). The optional `profile` records the model's classification (`level`, `kind`, `depth`, `domain`, `handsOn`, `hasTimeline`).

Client state in `localStorage`:

| Key | Contents |
|-----|----------|
| `compass:guide-done:<goal>` | Completed phase IDs |
| `compass:guide-history` | Recent guides (max 10) |
| `compass:theme` | `light` or `dark` |

## Commands

```bash
pnpm dev          # Start dev server on :3000
pnpm build        # Production build
pnpm test         # Run tests (vitest)
pnpm test:watch   # Watch mode
pnpm typecheck    # Type-check without emitting
pnpm cf:build     # Build for Cloudflare Workers (OpenNext)
pnpm cf:preview   # Build + wrangler dev
pnpm deploy       # Build + deploy to Cloudflare
```

## Tech Stack

- **Next.js 16** (App Router, Turbopack)
- **React 19**
- **Zod** (request/response validation)
- **react-markdown + remark-gfm + rehype-sanitize** (guide rendering)
- **remark-math + rehype-katex + katex** (math rendering)
- **OpenNext + Wrangler** (Cloudflare Workers deployment)
- **Instrument Serif + Inter** (editorial typography)
- **Vitest** (tests)

## Deployment (Cloudflare Workers)

The app deploys to Cloudflare Workers via [`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare):

- `open-next.config.ts` — OpenNext Cloudflare config
- `wrangler.jsonc` — Worker config (`compass`), sets `PROVIDER=openrouter` and the guide model as Worker vars
- `OPENROUTER_API_KEY` must be provided as a Worker secret (`wrangler secret put OPENROUTER_API_KEY`)

```bash
pnpm deploy
```

## Environment Variables

See `.env.example` for the full list. Key variables:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PROVIDER` | No | `mock` | `mock` or `openrouter` |
| `OPENROUTER_API_KEY` | If `openrouter` | — | OpenRouter API key |
| `OPENROUTER_MODEL` | No | — | Default model (fallback for guide model) |
| `OPENROUTER_GUIDE_MODEL` | No | `nvidia/nemotron-3-super-120b-a12b:free` | Model for study guides + chat |
| `OPENROUTER_BASE_URL` | No | `https://openrouter.ai/api/v1` | OpenRouter endpoint |
| `OPENROUTER_TIMEOUT_MS` | No | `120000` | Timeout for guide generation (ms) |
| `WEB_SEARCH` | No | `false` | Enable OpenRouter web-search plugin |
| `WEB_SEARCH_MAX_RESULTS` | No | `5` | Max web-search results |
