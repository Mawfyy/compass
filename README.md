# StudyGraph

Interactive learning map generator. Describe what you want to learn, get a visual graph of topics, prerequisites, resources, and projects — in the order you should learn them.

## Quick Start

```bash
pnpm install
cp .env.example .env
# add your API key to .env (see Provider Modes below)
pnpm dev
```

Open http://localhost:8080, type a learning goal, and generate your map.

## Provider Modes

Set `PROVIDER` in `.env` to choose how maps are generated:

| Mode | `PROVIDER` | What it does | Cost |
|------|-----------|--------------|------|
| **OpenRouter** | `openrouter` | Generates a full map via an LLM (best quality) | ~$0.001/map |
| **Jev** | `jev` | Routes to curated templates via TypeSafe AI judgments | Free tier available |
| **Mock** | `mock` | Deterministic keyword matching + generic scaffold | Free |

### OpenRouter (recommended)

Uses a generative LLM to produce a complete, specific learning map tailored to your goal.

```env
PROVIDER=openrouter
OPENROUTER_API_KEY=sk-or-...
OPENROUTER_MODEL=deepseek/deepseek-v4-flash-0731  # default, ~$0.001/map
```

Other model options:
- `meta-llama/llama-3.3-70b-instruct` — solid, $0.00032/map
- `nvidia/nemotron-3-super-120b-a12b:free` — free but lower quality
- `openrouter/auto` — router picks the best model (may be slow)

### Jev (TypeSafe AI)

Uses TypeSafe AI's judgment primitives to route your goal to the best-matching curated template.

```env
PROVIDER=jev
TYPESAFE_API_KEY=tskey_...
```

### Mock

No API key needed. Matches your goal against keyword lists, falls back to a generic scaffold.

```env
PROVIDER=mock
```

## Architecture

```
app/
  page.tsx                 # Landing page
  map/page.tsx             # Map view (reads search params)
  api/map/route.ts         # POST endpoint — generates maps
src/
  domain/map/              # Core types: LearningMap, MapNode, enums, Zod schemas
  application/map/         # GenerateMapService, templates, scaffold, Jev routing
  providers/               # DecisionProvider (Jev) + MapGenerator (OpenRouter)
    mock/                  # Deterministic keyword + scaffold
    jev/                   # TypeSafe AI judgments
    openrouter/            # Generative LLM via OpenRouter API
  infrastructure/          # Config loader
  ui/                      # React components (landing, React Flow canvas, drawer)
tests/                     # Vitest unit tests
```

### Data Flow

1. User submits a goal on the landing page
2. `POST /api/map` receives the request, validates with Zod
3. `GenerateMapService` delegates to the active provider:
   - **OpenRouter**: sends a structured prompt to the LLM, validates the response against `mapNodeSchema`, normalizes any invalid node types, falls back to scaffold on failure
   - **Jev**: translates the goal into judgment primitives (noul/score/choice), routes to the best template
   - **Mock**: keyword matching against curated templates, falls back to generic scaffold
4. Returns a `LearningMap` with a hierarchical node tree
5. Frontend renders it as an interactive React Flow graph

## Commands

```bash
pnpm dev          # Start dev server on :8080
pnpm build        # Production build
pnpm test         # Run tests (vitest)
pnpm test:watch   # Watch mode
pnpm typecheck    # Type-check without emitting
```

## Tech Stack

- **Next.js 16** (App Router, Turbopack)
- **React 19** + **@xyflow/react 12** (interactive graph)
- **Zod** (request/response validation)
- **TypeSafe AI** (`@typesafe-ai/sdk` — optional, for Jev mode)
- **Vitest** (tests)

## Environment Variables

See `.env.example` for the full list. Key variables:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PROVIDER` | No | `mock` | `mock`, `jev`, or `openrouter` |
| `OPENROUTER_API_KEY` | If `openrouter` | — | OpenRouter API key |
| `OPENROUTER_MODEL` | No | `deepseek/deepseek-v4-flash-0731` | Model to use |
| `TYPESAFE_API_KEY` | If `jev` | — | TypeSafe AI API key |
| `PROVIDER_TIMEOUT_MS` | No | `10000` | Timeout for Jev judgments (ms) |
| `OPENROUTER_TIMEOUT_MS` | No | `120000` | Timeout for map generation (ms) |
