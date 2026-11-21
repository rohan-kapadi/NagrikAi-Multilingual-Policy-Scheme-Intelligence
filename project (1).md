# NagrikAI — project.md

> AI-powered government scheme discovery and policy intelligence platform.
> Making government benefits understandable, accessible and actionable for every citizen.

**Hackathon:** IDEA//FORGE Online Hackathon — Track 1 (Civic Pulse, Digital Governance & Public Information), Problem 1: *Multilingual Policy, Rights & Scheme Explainer*.
**Builder:** solo, ~3 days. **Submission closes:** 22 Nov 2026, 11:59 PM.
**How to use this file:** read it fully before writing code. Build strictly in the order given in `phases.md`. Do not add features not listed here.

---

## 1. Problem

Government welfare schemes and policies are scattered across portals, PDFs and notifications. Citizens struggle to:

- find schemes relevant to their circumstances,
- understand eligibility rules,
- know which documents are required,
- understand notifications in their own language,
- find the correct official application portal.

NagrikAI solves this through one conversational interface (text and voice) in **English, Hindi and Marathi**.

## 2. Three user journeys

1. **Discover schemes.** A farmer gives location, occupation, land holding and needs. NagrikAI lists relevant schemes and explains why each may apply.
2. **Check eligibility.** A student asks if they qualify for a scholarship. NagrikAI evaluates each condition one by one, says what is missing, and lists required documents.
3. **Understand a policy.** A citizen uploads a government notice (PDF or image). NagrikAI explains it in simple English/Hindi/Marathi with references to the original text.

## 3. Scope

### P0 — must work end to end
1. Citizen profile capture (conversational, with clarifying questions for missing fields).
2. Personalized scheme discovery.
3. RAG question answering over scheme documents.
4. Rule-based eligibility assessment with per-criterion results and missing-info detection.
5. Multilingual output: English, Hindi, Marathi.
6. Source citations on every factual answer: scheme name, document, page/section, official URL.
7. Required documents list per scheme (taken from the source data only).

### P1 — only after P0 is demo-ready (in this priority order)
1. Voice input and spoken answers (Hindi + English first, Marathi if time permits).
2. Government notice upload (PDF/image) and plain-language explanation.
3. Scheme comparison (2 schemes side by side).
4. Saved schemes list.
5. NagrikVault — Zero-Knowledge client-side encrypted (AES-256-GCM) document locker with SHA-256 cryptographic verification hashes and automated profile extraction (Land 7/12, Income Certificate).
6. Nagrik Copilot Browser Extension (Manifest V3) — 1-click portal autofill assistant bridging verified citizen profile fields into official government application forms with human review.

### P2 — Post-hackathon polish features (Phases 9–11)
7. **Landing Page** — public marketing page at `/` with hero, features grid, how-it-works, language showcase, CTA to signup.
8. **Auth System** — email+password signup/login with SQLite persistence, bcrypt hashing, JWT session tokens. Protected app routes require login.
9. **Negotiated Memory** — user-controlled persistent memory across sessions. The AI proposes what to remember after each turn; user approves/rejects/edits each proposal individually. Memory is used as context in subsequent answers. Full CRUD memory panel in the UI.
10. **Explainability Layer** — every AI answer has a collapsible "Why this answer?" panel showing: intent classified, memory fields used, chunks retrieved with relevance scores, eligibility operators that fired.

### Out of scope (do NOT build)
Autonomous unassisted form submission without human confirmation (assisted autofill with citizen confirmation is supported), large-scale scraping, mobile app, multi-agent swarms in chat path, payments, push notifications.

## 4. Core design principles

1. **Eligibility is decided by code, not by the LLM.** The LLM only (a) extracts the profile from the user's words and (b) explains results. Pass/fail logic is deterministic.
2. **Grounded answers only.** The LLM may only state facts that appear in retrieved chunks or structured scheme data. If the source does not say it, answer "not specified in the source" and link the official portal.
3. **Never invent scheme data.** All scheme facts come from `data/schemes/*.json`, which the owner verifies against official sources. Placeholders must be marked `"verified": false`.
4. **Fast by default.** A normal question must answer in a few seconds. Use a simple pipeline, not a long agent loop.
5. **Honest uncertainty.** Every eligibility result is shown as *informational*, with a visible disclaimer that the official portal is final.

## 5. Architecture

Patterns reused from the owner's ACE (Autonomous Cognitive Engine) project, simplified for civic use:

| ACE pattern | NagrikAI equivalent |
|---|---|
| Clarification step | Ask for missing profile fields before judging eligibility |
| Structured research brief | `CitizenProfile` JSON object |
| Supervisor / sub-agents | One linear pipeline of small functions (not separate agents) |
| Final report | "Full plan for me" summary (P1 compare / plan view) |

### Pipeline (one chat turn)

```
User message (text or transcribed voice)
  → [1] Language detect / set response language (en | hi | mr)
  → [2] Intent classify: discover | eligibility | ask_question | explain_notice | compare | chitchat
  → [3] Profile extraction: LLM → partial CitizenProfile JSON (merge into session profile)
  → [4] Clarify: if required fields for the intent are missing → ask ONE short question, stop
  → [5] Retrieve:
        discover      → structured pre-filter (state, category) + vector search → top-k schemes
        eligibility   → load the named scheme(s) structured criteria
        ask_question  → vector search over chunks (filtered by scheme if named)
  → [6] Eligibility engine (code): per-criterion met / not_met / missing
  → [7] Explain: LLM writes the answer in the chosen language, using ONLY retrieved data + engine results
  → [8] Attach citations (from chunk metadata) and required documents (from scheme JSON)
  → Response JSON → UI
```

## 6. Tech stack

| Layer | Choice | Notes |
|---|---|---|
| Backend | Python 3.11, FastAPI, Pydantic v2, Uvicorn | |
| LLM | Provider-agnostic wrapper, configured by env | Default: Groq (fast, free tier) with Llama 3.3 70B; fallback Gemini. Keep calls behind `llm/client.py` |
| Embeddings | Multilingual embedding model | e.g. `intfloat/multilingual-e5-base` via sentence-transformers (local, free). Must work for Hindi/Marathi |
| Vector store | ChromaDB (persistent, local) | No external service |
| Frontend | React + Vite + TypeScript + Tailwind CSS | Single-page app, mobile-friendly |
| Voice (P1) | Browser Web Speech API for STT and TTS | Languages `en-IN`, `hi-IN`, `mr-IN`. No backend audio needed |
| PDF parsing (P1) | PyMuPDF; images via LLM vision or Tesseract fallback | |
| Storage | JSON files for scheme data; SQLite or in-memory for sessions | No auth |
| Deploy | Frontend on Vercel/Netlify, backend on Render/Railway, or run locally for the demo | Decide in the last phase |

## 7. Folder structure

```
nagrikai/
├── README.md
├── project.md
├── phases.md
├── .env.example
├── backend/
│   ├── app/
│   │   ├── main.py                 # FastAPI app, CORS, routers
│   │   ├── config.py               # env settings
│   │   ├── models.py               # Pydantic models (profile, scheme, criteria, responses)
│   │   ├── api/
│   │   │   ├── chat.py             # POST /api/chat
│   │   │   ├── schemes.py          # GET /api/schemes, GET /api/schemes/{id}
│   │   │   ├── eligibility.py      # POST /api/eligibility
│   │   │   └── notice.py           # POST /api/notice/explain (P1)
│   │   ├── pipeline/
│   │   │   ├── orchestrator.py     # runs the steps in section 5
│   │   │   ├── intent.py
│   │   │   ├── profile.py          # extraction + merge + missing-field logic
│   │   │   ├── retrieval.py        # prefilter + vector search
│   │   │   ├── eligibility.py      # deterministic rule engine
│   │   │   ├── explain.py          # grounded answer generation
│   │   │   └── citations.py
│   │   ├── llm/
│   │   │   ├── client.py           # provider wrapper
│   │   │   └── prompts.py          # all prompts in one place
│   │   └── ingest/
│   │       └── build_index.py      # reads data/ and builds Chroma index
│   ├── data/
│   │   ├── schemes/                # one JSON per scheme (see section 8)
│   │   └── sources/                # chunked source text per scheme (.md or .txt)
│   └── tests/
│       ├── test_eligibility.py
│       ├── test_profile.py
│       └── test_chat_smoke.py
└── frontend/
    └── src/
        ├── App.tsx
        ├── components/
        │   ├── ChatWindow.tsx
        │   ├── MessageBubble.tsx
        │   ├── SchemeCard.tsx
        │   ├── EligibilityChecklist.tsx
        │   ├── CitationList.tsx
        │   ├── LanguageSwitcher.tsx
        │   ├── ProfilePanel.tsx
        │   ├── VoiceButton.tsx       # P1
        │   └── NoticeUpload.tsx      # P1
        ├── lib/api.ts
        └── types.ts
```

## 8. Data models

### CitizenProfile (all fields optional until collected)
```json
{
  "age": 21,
  "gender": "female",
  "state": "Maharashtra",
  "district": "Pune",
  "residence": "rural | urban",
  "occupation": "farmer | student | worker | self_employed | unemployed | other",
  "annual_family_income": 180000,
  "caste_category": "general | obc | sc | st | other",
  "land_holding_hectares": 1.2,
  "education_level": "class_10 | class_12 | graduate | postgraduate | other",
  "is_disabled": false,
  "is_bpl": null,
  "language": "en | hi | mr"
}
```
`null` means "unknown" and must trigger a clarifying question when a criterion needs it.

### Scheme (`backend/data/schemes/<id>.json`)
```json
{
  "id": "pm-kisan",
  "name": {"en": "...", "hi": "...", "mr": "..."},
  "level": "central | state",
  "state": null,
  "category": ["agriculture"],
  "summary": {"en": "...", "hi": "...", "mr": "..."},
  "benefits": {"en": "...", "hi": "...", "mr": "..."},
  "criteria": [
    {
      "id": "c1",
      "label": {"en": "Owns cultivable land", "hi": "...", "mr": "..."},
      "field": "land_holding_hectares",
      "op": "gt",
      "value": 0,
      "source_ref": "chunk id or page"
    }
  ],
  "exclusions": [ /* same shape as criteria; if matched, user is NOT eligible */ ],
  "required_documents": [
    {"en": "Aadhaar card", "hi": "...", "mr": "..."}
  ],
  "how_to_apply": {"en": "...", "hi": "...", "mr": "..."},
  "official_url": "https://...",
  "source_documents": [
    {"title": "...", "url": "https://...", "retrieved_on": "2026-11-xx"}
  ],
  "verified": false
}
```

Supported `op` values: `eq, ne, lt, lte, gt, gte, in, not_in, between, is_true, is_false`.

### Eligibility result
```json
{
  "scheme_id": "pm-kisan",
  "overall": "eligible | likely_eligible | not_eligible | need_more_info",
  "criteria_results": [
    {"criterion_id": "c1", "label": "...", "status": "met | not_met | missing", "user_value": 1.2, "required": "> 0"}
  ],
  "missing_fields": ["land_holding_hectares"],
  "required_documents": ["..."],
  "citations": [ {"title": "...", "page": 3, "url": "..."} ]
}
```
Rules for `overall`: any exclusion matched or any criterion `not_met` → `not_eligible`; all criteria `met` → `eligible`; no `not_met` but some `missing` → `need_more_info`; use `likely_eligible` only when all required criteria are met and some optional ones are missing.

## 9. Schemes to cover (data owner fills and verifies)

Target 6–8 schemes, hand-verified from official sources. Suggested set:

- PM-KISAN (agriculture, central)
- Ayushman Bharat PM-JAY (health, central)
- One central scholarship via National Scholarship Portal
- One or two Maharashtra state schemes (education / farmers / women)
- One housing or livelihood scheme (e.g. PMAY or a self-employment loan scheme)

**Instruction to the coding agent:** create the loader, schema validation and **two clearly marked placeholder scheme files** (`"verified": false`, values prefixed `TODO_VERIFY`). Do not invent real eligibility numbers. The owner will replace placeholders with verified data. The app must show a small "unverified data" badge for any scheme with `verified: false`.

## 10. API

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/chat` | Main turn. Body: `{session_id, message, language, user_id?}`. Returns answer, schemes, eligibility, citations, `memory_proposals`, `explanation` |
| GET | `/api/schemes` | List schemes (filter by `category`, `state`) |
| GET | `/api/schemes/{id}` | Scheme detail |
| POST | `/api/eligibility` | Body: `{scheme_id, profile}` → eligibility result (no LLM) |
| POST | `/api/notice/explain` | P1. Multipart file + `language` → summary, key points, deadlines, citations to pages |
| GET | `/api/health` | Health check |
| POST | `/api/auth/signup` | P2. Body: `{email, name, password}` → `{token, user}` |
| POST | `/api/auth/login` | P2. Body: `{email, password}` → `{token, user}` |
| GET | `/api/auth/me` | P2. Returns current user (requires token) |
| POST | `/api/auth/logout` | P2. Clears session |
| GET | `/api/memory` | P2. Returns all memory entries for the authenticated user |
| POST | `/api/memory` | P2. Add a memory entry |
| PATCH | `/api/memory/{id}` | P2. Edit a memory entry |
| DELETE | `/api/memory/{id}` | P2. Delete a specific memory entry |
| DELETE | `/api/memory` | P2. Clear all memory for user |

Chat response shape (Phase 10+):
```json
{
  "answer": "string in requested language",
  "language": "hi",
  "profile": { },
  "clarifying_question": null,
  "schemes": [ { "id": "", "name": "", "why_relevant": "" } ],
  "eligibility": [ ],
  "citations": [ { "title": "", "page": 0, "section": "", "url": "" } ],
  "disclaimer": "string in requested language",
  "memory_proposals": [
    {
      "key": "occupation",
      "proposed_value": "farmer",
      "current_value": null,
      "change_type": "new",
      "reason": "You mentioned being a farmer"
    }
  ],
  "explanation": {
    "intent": "eligibility",
    "memory_fields_used": ["occupation", "land_holding_hectares"],
    "chunks_retrieved": [{"title": "...", "page": 1, "score": 0.87}],
    "eligibility_operators_fired": [{"criterion": "Owns cultivable land", "op": "gt", "value": 0, "user_value": 1.2, "result": "met"}],
    "language_detected": "hi"
  }
}
```

### Memory Entry model
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "key": "occupation",
  "value": "farmer",
  "source": "chat | manual | vault",
  "approved": true,
  "created_at": "ISO8601",
  "updated_at": "ISO8601"
}
```

### MemoryProposal model
```json
{
  "key": "land_holding_hectares",
  "proposed_value": 1.2,
  "current_value": null,
  "change_type": "new",
  "reason": "You mentioned 1.2 hectare land"
}
```

## 11. LLM prompting rules

- Keep all prompts in `llm/prompts.py`.
- **Profile extraction:** return strict JSON matching `CitizenProfile`; unknown fields must be `null`, never guessed. Use JSON mode / schema validation and retry once on parse failure.
- **Explanation prompt must state:** answer only from the provided context and eligibility results; respond in `{language}`; use short simple sentences (reading level of a school student); do not give legal advice; if information is missing say so; end with the disclaimer.
- Keep scheme names and official URLs unchanged across languages; translate everything else.
- Temperature ≤ 0.2 for extraction and explanation.

## 12. Frontend requirements

- One main chat screen, mobile-first, clean and accessible (large text, high contrast).
- Language switcher (EN / हिन्दी / मराठी) in the header; the whole UI chrome and the answers change language.
- Profile side panel showing collected fields (editable) so users see what the system knows.
- **SchemeCard:** name, one-line why-relevant, eligibility badge, "View details".
- **EligibilityChecklist:** each criterion with ✅ met, ❌ not met, ❓ needs info.
- **Required documents** list and **How to apply** with the official portal link as a button.
- **CitationList** under every answer; each citation links to the official URL.
- Persistent disclaimer footer.
- Loading and error states for every call.
- P1: microphone button with language selection, a "listen" button on answers, a notice upload dropzone.

## 13. Quality bar and testing

- Unit tests for the eligibility engine covering every operator, missing-value handling, and exclusion logic.
- Test that profile extraction returns `null` for unknown fields.
- Smoke test for `/api/chat` with a farmer example and a student example.
- Manual accuracy check: for each verified scheme, run 3 profiles (clearly eligible, clearly not, missing info) and confirm the outputs.

## 14. Demo script (design the product so this works flawlessly)

1. Hindi voice or text: "Main Pune ka kisan hoon, 1.2 hectare zameen hai" → clarifying question about income/category → ranked schemes with reasons.
2. Open a scheme → checklist with ✅/❌/❓, required documents, official link.
3. Switch the language to Marathi → same answer re-explained.
4. Upload a government notice → plain-language explanation with page references.
5. Show a citation opening the official source.

## 15. Non-functional

- Secrets only via `.env`; ship `.env.example`.
- CORS enabled for the frontend origin.
- No personal data persisted beyond the session; say so in the UI. Do not ask for Aadhaar numbers or any government ID numbers.
- README must include: problem, architecture diagram (text or mermaid), setup steps, env vars, demo steps, limitations.

## 16. Rules for the coding agent

1. Follow `phases.md` strictly, one phase at a time. After each phase, stop and summarize what works and how to run it.
2. Keep code simple and readable. No unnecessary abstractions or extra dependencies.
3. Do not invent government data. Use placeholders marked `TODO_VERIFY`.
4. Do not call the LLM for eligibility decisions.
5. Keep responses fast: no multi-step agent loops in the normal chat path.
6. If something is ambiguous, choose the simplest option that satisfies this file and note the assumption.
