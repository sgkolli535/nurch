# Nurch — AI-Powered Plant Health Platform

<p align="center">
  <img src="demo/screenshot-garden.png" alt="Nurch Garden View" width="300" />
  <img src="demo/screenshot-diagnosis.png" alt="Nurch Diagnosis" width="300" />
</p>

> Virtual gardens · AI diagnostics · Trustworthy recommendations

Nurch is a mobile application that creates **digital twins of real-world gardens** and uses **AI vision models** to diagnose plant health issues, predict problems before they become visible, and deliver care recommendations grounded in scientific sources. Every AI response shows its reasoning, cites its sources, and states its confidence level — differentiating Nurch from generic chatbot advice.

## Demo


---

## Why Nurch?

Most plant loss in home gardens results from preventable issues — under/over-watering, nutrient deficiencies, light mismatches, undetected pest onset. Existing solutions are either expensive hardware that shows raw data without interpretation, or slow forums disconnected from the user's specific conditions.

Nurch combines **real-time AI analysis** with **location-aware intelligence** and a structured knowledge layer to solve this. The platform is designed around three reinforcing loops:

1. **Virtual garden investment** → users build a persistent digital record of their plants (retention)
2. **Data flywheel** → every photo, diagnosis, and outcome improves the AI (defensibility)
3. **Trust signals** → reasoning chains, source citations, and confidence levels build user trust (differentiation)

---

## Technical Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  Mobile App (Expo / React Native)                               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ ┌────────┐ │
│  │ Isometric│ │ Diagnosis│ │  Agent   │ │Calendar│ │Profile │ │
│  │ Garden   │ │  Flow    │ │  Chat    │ │        │ │        │ │
│  │ (SVG)    │ │          │ │  (SSE)   │ │        │ │        │ │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └───┬────┘ └───┬────┘ │
│       │             │            │            │          │      │
│       └─────────────┴────────────┴────────────┴──────────┘      │
│                              │ Axios + JWT                      │
└──────────────────────────────┼──────────────────────────────────┘
                               │
┌──────────────────────────────┼──────────────────────────────────┐
│  Backend (FastAPI)           │                                   │
│  ┌───────────────────────────┴───────────────────────────────┐  │
│  │                    12 REST API Routers                     │  │
│  │  auth · gardens · plants · photos · diagnoses · species   │  │
│  │  location · dashboard · agent · notifications · evals     │  │
│  └───┬───────────┬──────────────┬────────────┬───────────────┘  │
│      │           │              │            │                   │
│  ┌───┴───┐  ┌───┴──────┐  ┌───┴────┐  ┌───┴──────────────┐   │
│  │Prompt │  │ LangGraph │  │  Eval  │  │  Background      │   │
│  │Registry│  │  Agent   │  │ System │  │  Tasks           │   │
│  │(v1/v2)│  │  Graph   │  │        │  │  (APScheduler)   │   │
│  └───┬───┘  └───┬──────┘  └───┬────┘  └──────────────────┘   │
│      │          │              │                                │
│  ┌───┴──────────┴──────────────┴──────────────────────────┐    │
│  │              AI Provider Abstraction                    │    │
│  │         OpenAI (GPT-4o) · Gemini · Claude              │    │
│  └────────────────────────────────────────────────────────┘    │
│                              │                                  │
└──────────────────────────────┼──────────────────────────────────┘
                               │
         ┌─────────────────────┼──────────────────────┐
         │                     │                       │
   ┌─────┴──────┐    ┌───────┴────────┐    ┌────────┴───────┐
   │ Supabase   │    │ Supabase       │    │ Firebase       │
   │ PostgreSQL │    │ Storage        │    │ Cloud          │
   │ (15 models)│    │ (plant photos) │    │ Messaging      │
   └────────────┘    └────────────────┘    └────────────────┘
```

### Tech Stack

| Layer | Technology |
|---|---|
| Mobile | Expo (React Native) + TypeScript, Expo Router, react-native-svg, react-native-reanimated |
| Backend | Python FastAPI, SQLAlchemy (async), Alembic migrations |
| Database | PostgreSQL via Supabase (15 models, JSONB for flexible AI output) |
| AI Agent | LangGraph stateful graph with 5 tools, conditional edges, citation extraction, confidence scoring |
| AI Vision | Multi-provider: OpenAI GPT-4o / Google Gemini / Anthropic Claude (swappable via env var) |
| Storage | Supabase Storage (S3-compatible presigned upload URLs) |
| Push | Firebase Cloud Messaging with per-tier throttling |
| Evals | Automated diagnosis accuracy, recommendation safety, and confidence calibration checks |

---

## Technical Complexities

### 1. LangGraph Agent with Tool-Calling and Trust Signals

The garden assistant isn't a simple chat wrapper — it's a **stateful LangGraph graph** with 6 nodes and conditional edges:

```
gather_context → agent_reasoning ⟷ tools → cite_sources → score_confidence → format_response
```

**Why this is complex:**
- The agent must decide at each turn whether to call tools or respond directly. The `should_use_tools` conditional edge inspects the LLM's response for `tool_calls` and loops back through tool execution until the LLM is satisfied.
- 5 tools (`get_garden_overview`, `get_plant_detail`, `get_weather`, `get_care_calendar`, `get_species_info`) each open independent database sessions and query across multiple joined tables.
- **Citation extraction** runs post-response, parsing both explicit `(Source: UC_DAVIS)` patterns and natural language references ("According to Cooperative Extension...") via regex.
- **Confidence scoring** is heuristic — no additional LLM call. It factors in: whether garden context was available, how many citations were produced, whether tools were used, hedging language frequency, and response length.
- The LLM is swappable between Claude/GPT-4o/Gemini via a single config change — `_get_llm()` returns the appropriate `ChatAnthropic`, `ChatOpenAI`, or `ChatGoogleGenerativeAI` based on `AI_PROVIDER`.

### 2. AI Diagnostic Engine with Structured Multi-Category Output

Each plant diagnosis is not a single label — it's a **structured JSON response across 6 categories** with per-category confidence scores, severity ratings, and specific actions:

```
hydration · nutrients · pests · disease · environmental_stress · growth
```

**Why this is complex:**
- The **context payload** assembled for each diagnosis includes: the photo, plant species profile (ideal ranges, known symptoms from our curated DB), location data (weather forecast, soil type, hardiness zone, day length), and the last 5 diagnoses for longitudinal change detection.
- When a plant has previous photos, both images are sent for **change detection** — the AI must compare across time and identify improvements, deteriorations, new issues, and resolved issues.
- The v2 diagnosis prompt (see Prompt Engineering below) requires **mandatory reasoning chains** — the AI must show step-by-step logic for every observation, not just state conclusions.
- Responses are validated against species data via the eval system. If the AI says "needs more sun" but the species is shade-loving, it's flagged.

### 3. Prompt Engineering as Engineering Artifacts

Prompts are **versioned, testable, and traceable** — not strings embedded in code.

```
backend/app/prompts/
├── registry.py      # Code-first loading with DB override for A/B testing
├── diagnosis.py     # v1 (basic) → v2 (reasoning chains, citations, confidence)
└── agent.py         # v1 (basic) → v2 (show work, cite sources, admit uncertainty)
```

**Why this matters:**
- Each version has a documented **changelog explaining why the change was made** and its measured impact. For example, v2 of the diagnosis prompt was motivated by the observation that v1 produced responses indistinguishable from generic ChatGPT — adding mandatory citations and reasoning chains reduced user follow-up questions by preemptively answering "why."
- The `PromptVersion` model in the DB tracks `eval_metrics` per version, enabling **A/B testing**: set `is_active=true` on a DB row to override the code-level prompt without a deploy.
- Every diagnosis stores `prompt_version_used`, so you can retroactively analyze which prompt version produced which quality of output.

### 4. Eval & Quality System

The AI doesn't just run — it's **continuously validated** against ground truth.

```
backend/app/evals/
├── diagnosis_eval.py       # Cross-reference AI output against species DB
├── recommendation_eval.py  # Validate actions match species care requirements
└── safety_eval.py          # Scan for dangerous chemicals, toxic plant advice
```

**Specific checks:**
- If AI identifies a pest not in `species.common_pests` with high confidence → flagged as potential hallucination
- If AI recommends "water daily" but species has `water_needs: "low"` → flagged as contradictory
- If AI mentions neonicotinoids, chlorpyrifos, or suggests eating a toxic plant → blocked by safety guardrails
- `POST /api/v1/evals/run-batch` re-evaluates the last N diagnoses — used for **regression testing after prompt changes**
- `GET /api/v1/evals/metrics` shows pass rates over time by eval type

### 5. Guardrails and Failure Handling

AI failures are tracked as first-class entities, not silently swallowed.

```python
class AIFailure(Base):
    failure_type: str   # hallucination, confidence_miscalibration, harmful_recommendation, ...
    severity: str       # low, medium, high, critical
    input_summary: str
    actual_output: str
    resolution: str
```

**Guardrails in the agent graph:**
- `validate_response_against_species()` checks for contradictions (sun/water/frost advice vs. species data)
- `check_safety()` regex-scans for dangerous recommendation patterns
- `apply_confidence_fallback()` appends "consult your local Cooperative Extension office" when confidence is low
- Known failure patterns are documented in [FAILURES.md](FAILURES.md) with root causes and mitigations

### 6. 2.5D Isometric Garden with Grid-Based Zone System

The virtual garden is an interactive isometric canvas built with **react-native-svg** that works on web, iOS, and Android:

- Zones are rendered as **isometric diamond shapes** with 3D depth (side faces for visual depth)
- Each zone has a **configurable grid** (default 3×3) — plants snap to grid cells
- Plants are rendered as **custom SVG sprite illustrations** (20 unique species sprites matching the Nurch design system)
- **Edit mode**: tap a plant to select → tap empty cell to move or tap another plant to swap positions. Arrow buttons move zones one grid step. +Col/+Row buttons resize the zone grid.
- All position changes persist immediately to the API
- The canvas supports **pinch-to-zoom and pan** via react-native-gesture-handler

### 7. Multi-Provider AI Abstraction

The AI layer is designed to **swap providers without code changes**:

```python
# backend/app/config.py
AI_PROVIDER=openai    # or "gemini" or "claude"

# backend/app/services/ai_provider.py
class AIProvider(ABC):
    async def analyze_photo(self, photo_bytes, context_payload, system_prompt, ...) -> dict
    async def chat(self, messages, system_prompt, tools) -> dict

class OpenAIProvider(AIProvider): ...   # GPT-4o with vision
class GeminiProvider(AIProvider): ...   # Gemini Flash (free tier)
class ClaudeProvider(AIProvider): ...   # Claude Sonnet/Opus with model routing
```

The LangGraph agent uses `langchain-openai`/`langchain-anthropic`/`langchain-google-genai` interchangeably. The diagnostic engine uses the raw provider SDKs for vision. Both read the same `AI_PROVIDER` config.

**Model routing (Claude only):** Routine single-issue diagnoses use Sonnet. Complex cases (3+ active issues, unknown species, deep analysis) route to Opus.

---

## Project Structure

```
nurch/
├── backend/                          # FastAPI + SQLAlchemy
│   ├── app/
│   │   ├── models/      (15)        # SQLAlchemy ORM models
│   │   ├── schemas/     (7)         # Pydantic request/response
│   │   ├── routers/     (12)        # REST API endpoints
│   │   ├── services/    (10)        # AI providers, agent graph, guardrails
│   │   ├── prompts/     (3)         # Versioned prompt registry
│   │   ├── evals/       (3)         # Diagnosis accuracy, safety, recommendation checks
│   │   ├── tasks/       (3)         # Background: frost alerts, photo reminders, summaries
│   │   └── seed/species/ (20)       # Curated species JSON files
│   └── alembic/                      # Database migrations
├── mobile/                           # Expo + React Native
│   ├── app/                          # Expo Router screens (14 screens)
│   │   ├── (auth)/                   # Login, register, onboarding
│   │   ├── (tabs)/                   # Home, garden, scan, calendar, profile
│   │   ├── plant/[plantId]/          # Plant profile, diagnosis flow
│   │   ├── garden/                   # Create garden, add plant/zone
│   │   ├── agent/                    # AI chat with streaming
│   │   └── settings/                 # Notifications, profile
│   └── src/
│       ├── components/               # UI primitives, garden sprites, trust UI
│       │   ├── ui/        (7)        # Button, Card, Text, Badge, StatusDot, Input, LoadingPulse
│       │   ├── garden/    (4)        # IsometricCanvas, GardenToolbar, PlantCard, 20 PlantSprites
│       │   ├── trust/     (3)        # ConfidenceBadge, ReasoningChain, CitationList
│       │   ├── dashboard/ (3)        # WeatherWidget, UpcomingTasks, AlertBanner
│       │   └── scan/      (1)        # DiagnosisResult
│       ├── hooks/         (7)        # useAuth, useGarden, usePlant, useCamera, etc.
│       ├── services/      (6)        # API client, typed service modules
│       ├── stores/        (2)        # Zustand state management
│       └── theme/         (4)        # Nurch design system tokens
├── demo/                             # Self-contained HTML demo
├── FAILURES.md                       # AI failure patterns & mitigations
└── README.md
```

---

## Running Locally

### Prerequisites
- Python 3.11+ (via `uv`)
- Node.js 18+
- Supabase account (PostgreSQL + Storage)
- One AI provider key: OpenAI, Gemini, or Anthropic

### Backend
```bash
cd backend
uv venv --python 3.14
source .venv/bin/activate
cp .env.example .env                   # Edit with your credentials
uv pip install -e .
alembic upgrade head                   # Create database tables
.venv/bin/python -m app.seed.load_species   # Seed 20 plant species
uvicorn app.main:app --reload          # http://localhost:8000
```

### Mobile
```bash
cd mobile
npm install
npx expo start                         # Press 'w' for web
```

### Environment Variables
```env
DATABASE_URL=postgresql+asyncpg://...   # Supabase pooler connection
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
AI_PROVIDER=openai                      # or "gemini" or "claude"
OPENAI_API_KEY=sk-...                   # if using OpenAI
FIREBASE_CREDENTIALS_PATH=./firebase-service-account.json
```
