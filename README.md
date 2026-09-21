# Compass

Turn any learning goal into a personalized **Study Guide** or an interactive **Learning Path** map.

Describe your destination, and Compass maps your journey to knowledge — a clear, ordered plan with the right topics, resources, and projects at each step.

- **Guide-first** — a written, structured study guide you can check off phase by phase.
- **Optional map** — convert any guide into an interactive visual graph of topics, prerequisites, and projects.
- **Personalized by default** — an AI goal profile classifies your level, goal type, depth, and domain, then folds it into generation.

## Quick Start

```bash
pnpm install
cp .env.example .env
# add your API key to .env (see Provider Modes below)
pnpm dev
```

Open `http://localhost:3000`, type a learning goal, and generate your guide.

## How It Works

1. **Describe your goal** — tell Compass what you want to learn and where you're starting.
2. **Get your guide** — Compass writes a personalized, ordered study plan (phases, topics, labeled resources).
3. **Learn in order** — check off phases, track your progress, and open it as a map anytime.

## Pages

| Route | Purpose |
|-------|---------|
| `/` | Landing — single input, warm editorial aesthetic |
| `/guide` | Study guide (text) — the primary experience |
| `/map` | Interactive learning map (React Flow graph) |
| `/why` | Why Compass (feature overview) |
| `/how` | How it works |

## Provider Modes

Set `PROVIDER` in `.env` to choose how guides are generated:

| Mode | `PROVIDER` | What it does | Cost |
|------|-----------|--------------|------|
| **OpenRouter** | `openrouter` | Generates a full guide via an LLM (best quality) | ~$0.001/guide |
| **Jev** | `jev` | Routes to curated templates via TypeSafe AI judgments | Free tier available |
| **Mock** | `mock` | Deterministic keyword matching + generic scaffold | Free |

### OpenRouter (recommended)

Uses a generative LLM to produce a complete, specific study guide tailored to your goal.

```env
PROVIDER=openrouter
OPENROUTER_API_KEY=sk-or-...
OPENROUTER_MODEL=google/gemini-3.8-flash  # default, fast + structured outputs
```

The guide model is configurable via `OPENROUTER_GUIDE_MODEL` (defaults to `OPENROUTER_MODEL`).

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

### Goal Profiling

When `TYPESAFE_API_KEY` is set alongside `PROVIDER=openrouter`, Jev classifies each goal across six dimensions — `level`, `kind`, `depth`, `domain`, `handsOn`, and whether a `timeline` is implied. Those signals tailor the guide (starting point, phase ordering, and resource mix). Without a key — or if the Jev call fails — Compass falls back to sensible defaults.

## Architecture

```
app/
  page.tsx                 # Landing page
  guide/page.tsx           # Study guide (text) view
  map/page.tsx             # Map view (reads search params)
  why/page.tsx             # Why Compass
  how/page.tsx             # How it works
  api/guide/route.ts       # POST endpoint — generates guides
  api/map/route.ts         # POST endpoint — generates maps
src/
  domain/guide/            # StudyGuide type + Zod schema
  domain/map/              # LearningMap, MapNode, enums, Zod schemas
  application/guide/       # Goal profiling (Jev classification)
  application/map/         # GenerateMapService, templates, scaffold, Jev routing
  providers/               # DecisionProvider (Jev) + GuideGenerator/MapGenerator (OpenRouter)
    mock/                  # Deterministic keyword + scaffold
    jev/                   # TypeSafe AI judgments
    openrouter/            # Generative LLM via OpenRouter API
  infrastructure/          # Config loader
  ui/                      # React components (landing, guide, map, drawer)
tests/                     # Vitest unit tests
```

### Guide Output

A study guide is a validated, structured JSON object:

```
{ intro, prerequisites?, phases, milestones }
```

Each phase has a `title`, `duration`, and markdown `body` with labeled activity types: `[Course]`, `[Reading]`, `[Exercise]`, `[Case Study]`, `[Certification]`. Progress is persisted in `localStorage` under `compass:guide-done:<goal>`, and recent guides are stored in `compass:guide-history`.

## Node Types

Every node in a learning map has a `type` that describes what it represents:

| Type | Purpose |
|------|---------|
| `goal` | The root — the overall learning objective |
| `area` | A broad domain of study (e.g. Mathematics, Programming) |
| `topic` | A unit of knowledge within an area |
| `subtopic` | A subdivision of a topic |
| `skill` | A concrete capability to acquire |
| `concept` | An individual idea or principle |
| `tool` | A software/tool to learn and use |
| `project` | A hands-on build that applies the material |
| `milestone` | A checkpoint along the path |
| `course` | A formal, structured course to complete |
| `reading` | A specific book, paper, or text to study |
| `exercise` | Hands-on drills or practice problems |
| `case-study` | A real-world example to analyze |
| `certification` | An exam or credential worth earning |

Node types are defined once in `src/domain/map/enums.ts` (`MAP_NODE_TYPES`); validation (Zod), rendering, and colors all derive from that list. To add a type, add the string there plus a color in `src/ui/map/graph.ts` (`NODE_TYPE_COLORS`).

## Commands

```bash
pnpm dev          # Start dev server on :3000
pnpm build        # Production build
pnpm test         # Run tests (vitest)
pnpm test:watch   # Watch mode
pnpm typecheck    # Type-check without emitting
```

## Tech Stack

- **Next.js 16** (App Router, Turbopack)
- **React 19** + **@xyflow/react 12** (interactive graph)
- **Zod** (request/response validation)
- **react-markdown + remark-gfm + rehype-sanitize** (guide rendering)
- **Instrument Serif + Inter** (editorial typography)
- **TypeSafe AI** (`@typesafe-ai/sdk` — optional, for Jev mode)
- **Vitest** (tests)

## Environment Variables

See `.env.example` for the full list. Key variables:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PROVIDER` | No | `mock` | `mock`, `jev`, or `openrouter` |
| `OPENROUTER_API_KEY` | If `openrouter` | — | OpenRouter API key |
| `OPENROUTER_MODEL` | No | `google/gemini-3.8-flash` | Model to use |
| `OPENROUTER_GUIDE_MODEL` | No | `OPENROUTER_MODEL` fallback | Model for study guides |
| `TYPESAFE_API_KEY` | No | — | TypeSafe AI key; enables goal profiling alongside OpenRouter |
| `TYPESAFE_MODEL` | No | `jev-latest` | TypeSafe AI model |
| `OPENROUTER_BASE_URL` | No | `https://openrouter.ai/api/v1` | OpenRouter endpoint |
| `OPENROUTER_TIMEOUT_MS` | No | `60000` | Timeout for generation (ms) |