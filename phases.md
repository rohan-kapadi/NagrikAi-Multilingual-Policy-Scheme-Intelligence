# NagrikAI — phases.md

Build in this order. **Complete one phase, run it, verify the "Done when" checks, then stop and report before starting the next.** Read `project.md` first; it is the source of truth for scope, data models and rules.

Timeline (submission closes 22 Nov, 11:59 PM): Phases 0–3 by end of 20 Nov, Phases 4–6 by end of 21 Nov, Phases 7–8 on 22 Nov, Phases 9–11 on 22 Nov (submit by evening).

---

## Phase 0 — Scaffold (≈1 hr) ✅ DONE
**Do**
- Create the folder structure from `project.md` §7.
- Backend: FastAPI app with `/api/health`, CORS, `config.py` loading `.env`, Pydantic models from §8.
- Frontend: Vite + React + TS + Tailwind with a blank chat page that calls `/api/health`.
- Add `.env.example` (LLM key, model name, embedding model, CORS origin) and a README stub with run commands.

**Done when:** backend starts, frontend loads, and the page shows "backend connected".

---

## Phase 1 — Scheme data layer (≈2 hrs) ✅ DONE
**Do**
- Define the Scheme JSON schema and a loader with validation (`verified` flag, three languages).
- Create **two placeholder schemes** (`verified: false`, `TODO_VERIFY` values) plus matching source-text files in `data/sources/`.
- Implement `GET /api/schemes` and `GET /api/schemes/{id}`.
- Write `ingest/build_index.py`: chunk source texts (≈500 tokens, with title/page/section/url metadata) and store in ChromaDB using the multilingual embedding model.

**Done when:** schemes list endpoint works, and a test script retrieves relevant chunks for an English query and a Hindi query.

> Owner task in parallel: replace placeholders with 6–8 verified schemes from official sources (criteria, documents, URLs, source text).

---

## Phase 2 — Eligibility engine (≈2 hrs) ✅ DONE
**Do**
- Implement `pipeline/eligibility.py` with all operators from §8, exclusions, and `met / not_met / missing` per criterion plus the `overall` rules.
- Implement `POST /api/eligibility` (no LLM).
- Write `tests/test_eligibility.py`: every operator, missing values, exclusion match, each `overall` outcome.

**Done when:** all tests pass and the endpoint returns the correct result for the placeholder schemes with sample profiles.

---

## Phase 3 — LLM client and profile extraction (≈2 hrs) ✅ DONE
**Do**
- `llm/client.py`: provider wrapper with JSON mode, retry once on invalid JSON, timeout, and clear errors.
- `pipeline/profile.py`: extract a partial `CitizenProfile` from a message (supports Hindi, Marathi, Hinglish), merge into the session profile, compute missing required fields for a given intent/scheme.
- `pipeline/intent.py`: classify intent (discover, eligibility, ask_question, explain_notice, compare, chitchat).
- `tests/test_profile.py`: unknown fields stay `null`; no guessing.

**Done when:** the message "Main Pune ka kisan hoon, 1.2 hectare zameen hai" yields `occupation=farmer`, `district=Pune`, `land_holding_hectares=1.2`, everything else `null`.

---

## Phase 4 — Chat pipeline (core) (≈3 hrs) ✅ DONE
**Do**
- `pipeline/retrieval.py`: structured pre-filter (state, category) plus vector search; return top-k schemes and chunks.
- `pipeline/explain.py` and `llm/prompts.py`: grounded explanation prompts per `project.md` §11, response language selectable.
- `pipeline/citations.py`: build citations from chunk/scheme metadata only.
- `pipeline/orchestrator.py`: wire steps from §5 (language, intent, profile, clarify, retrieve, eligibility, explain, citations, documents).
- `POST /api/chat` with session profile kept per `session_id`.
- Clarification behaviour: ask exactly one short question when required fields are missing.

**Done when:** via curl or a test, the farmer example gets a clarifying question first, then a ranked scheme list with reasons; a student asking about a scholarship gets a per-criterion eligibility answer with documents and citations; asking about something not in the data returns "not specified in the source" plus the official link.

---

## Phase 5 — Frontend MVP (≈4 hrs) ✅ DONE
**Do**
- ChatWindow, MessageBubble, language switcher (EN/HI/MR) for UI text and answers.
- SchemeCard, EligibilityChecklist (✅ ❌ ❓), CitationList, required documents, "Apply on official portal" button.
- ProfilePanel showing and allowing edits to collected fields.
- Disclaimer footer, "unverified data" badge, loading and error states, mobile-first layout.

**Done when:** the full journeys 1 and 2 work in the browser in all three languages with citations visible.

**— P0 COMPLETE. Commit and tag `p0-complete`. Everything after this is P1. —**

---

## Phase 6 — Voice (P1, ≈3 hrs) ✅ DONE
**Do**
- `VoiceButton`: Web Speech API speech-to-text with language selection (`en-IN`, `hi-IN`, `mr-IN`); the transcript is sent as a normal chat message.
- "Listen" button on each answer using speech synthesis in the selected language.
- Graceful fallback message when the browser does not support speech or a language voice is missing.

**Done when:** a Hindi spoken question produces a Hindi answer that can be read aloud, and unsupported browsers fall back to text without errors.

---

## Phase 7 — Notice upload and explainer (P1, ≈3 hrs) ✅ DONE
**Do**
- `POST /api/notice/explain`: accept PDF or image; extract text (PyMuPDF; for scanned files use LLM vision or OCR fallback); chunk with page numbers.
- Return: a short plain-language summary, key points, deadlines and who is affected, and page-referenced citations. Output language selectable (EN/HI/MR).
- `NoticeUpload` component with progress and results view.
- Limit file size and page count; show clear errors.

**Done when:** a sample government PDF produces an accurate simple-language summary in Hindi with page references.

---

## Phase 7b — NagrikVault & Autofill Extension Copilot (P1+, ≈2 hrs) ✅ DONE
**Do**
- `NagrikVault` frontend component:
  - Secure document upload zone (Income Certificate, 7/12 Land Record, Caste Certificate, Marksheet).
  - Client-side cryptographic integrity hashing (SHA-256) & AES-256-GCM encryption demonstration for tamper-proof storage without server exposure.
  - Automatic extraction of critical fields (land area in hectares, annual family income, category) into the `CitizenProfile` state.
  - "Sync with Nagrik Copilot" profile bridge.
- `extension/` Manifest V3 Browser Extension:
  - `manifest.json`, `popup.html`, `popup.js`, `content.js` for Chromium browsers (Chrome/Edge/Brave).
  - Matches scheme portals (PM-KISAN, NSP, demo portal).
  - 1-click "⚡ Auto-Fill Application Form" button that fills citizen inputs (Name, Category, Land Area, Income, State, District, IFSC/Account) with visual confirmation badges and human-in-the-loop validation.
- Interactive demo portal test page to verify and demonstrate autofill behavior reliably without live captcha obstacles.

**Done when:** uploading an eligibility document parses data directly into the citizen profile with cryptographic hash verification, and the extension auto-fills a scheme application form in one click.

---

## Phase 8 — Polish, deploy, submit (≈4 hrs) ✅ DONE
**Do**
- Run the accuracy check from `project.md` §13 for every verified scheme (3 profiles each) and fix data or logic problems.
- Prepare the demo flow from §14 and rehearse it; add 3 "example prompt" chips on the home screen (farmer, student, notice).
- Complete the README: problem, architecture diagram, setup, env vars, limitations, demo steps.
- Deploy (or confirm the local demo is stable). Record a 2–3 minute demo video.
- Fill the Challazo submission and the Google form well before 11:59 PM on 22 Nov.

**Done when:** a fresh clone runs from the README, the demo video is recorded, and the submission is made.

---

## Phase 9 — Landing Page + Auth (≈3 hrs)
**Do**
- **Landing Page** (`/`) — marketing page that sells NagrikAI to visitors:
  - Hero section: headline, subheadline, CTA buttons ("Get Started Free" → signup, "See Demo" → scrolls to demo section).
  - Features grid: 4 key features (Scheme Chat, Eligibility Engine, Notice Explainer, NagrikVault) with icons.
  - "How It Works" 3-step section.
  - Language showcase: live animated text in EN/HI/MR.
  - Footer with links.
  - Fully responsive, emerald-green brand theme consistent with app.
- **Auth System:**
  - Backend: `POST /api/auth/signup`, `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout`.
  - SQLite database (`backend/data/nagrik.db`) for user storage.
  - Passwords hashed with `bcrypt`. Sessions via signed JWT stored in `httpOnly` cookie (or `localStorage` for demo simplicity).
  - `User` model: `id`, `email`, `name`, `hashed_password`, `created_at`, `preferred_language`.
  - `AuthModal` frontend component: tabbed Login / Signup form, inline validation, error display.
  - Protected routes: app tabs (`/app`) require login; landing page (`/`) is public.
  - On login, user's name appears in the header and profile panel.

**New files:**
- `backend/app/api/auth.py`
- `backend/app/db.py` (SQLite connection + user CRUD)
- `frontend/src/pages/LandingPage.tsx`
- `frontend/src/components/AuthModal.tsx`
- `frontend/src/lib/auth.ts`

**Done when:** visiting `/` shows the landing page; unauthenticated users clicking "Get Started" see the auth modal; after signup/login they are taken to the app; header shows their name; logout returns to landing.

---

## Phase 10 — Negotiated Memory System (≈4 hrs)
**Do**

The **Negotiated Memory** system gives users full visibility and control over what NagrikAI remembers about them. Unlike the in-session profile, this memory persists across sessions and must be explicitly approved by the user.

### Backend
- `backend/app/api/memory.py`:
  - `GET /api/memory` — returns all memory entries for the logged-in user.
  - `POST /api/memory` — user manually adds a memory entry.
  - `PATCH /api/memory/{id}` — user edits a memory entry.
  - `DELETE /api/memory/{id}` — user deletes a specific memory entry.
  - `DELETE /api/memory` — user clears all memory.
- `backend/app/db.py` additions:
  - `memory_entries` table: `id`, `user_id`, `key` (e.g. `"occupation"`), `value` (e.g. `"farmer"`), `source` (`"chat"` | `"manual"` | `"vault"`), `approved` (bool), `created_at`, `updated_at`.
- `backend/app/pipeline/memory.py`:
  - `get_user_memory(user_id) → Dict` — returns all approved memory for a user.
  - `propose_memory_entries(extracted_profile, existing_memory) → List[MemoryProposal]` — computes which new/changed fields the AI wants to remember from this chat turn; returns proposals (not automatically saved).
  - `save_memory_entry(user_id, key, value, source)` — saves an approved memory entry.
- **Orchestrator change** in `pipeline/orchestrator.py`:
  - If user is logged in, load their approved memory and merge it into the session `CitizenProfile` at step [3] (profile extraction).
  - After generating the answer, compare the extracted profile to existing memory — produce `memory_proposals` list of new/changed entries.
  - Include `memory_proposals` in the `ChatResponse`.
- New `ChatResponse` field: `memory_proposals: List[MemoryProposal]`.
- `MemoryProposal` model: `key`, `proposed_value`, `current_value`, `change_type` (`"new"` | `"update"`), `reason` (short human-readable reason).

### Frontend
- `MemoryPanel` component (`frontend/src/components/MemoryPanel.tsx`):
  - Slide-in panel (similar to ProfilePanel) showing all stored memory entries as editable cards.
  - Each card shows: key name (human-readable label), value, source badge, timestamp, Edit + Delete buttons.
  - "Clear All Memory" button with confirmation dialog.
  - Accessible via a "Memory" button in the header (brain icon 🧠).
- `MemoryProposalToast` component:
  - After each AI response, if `memory_proposals` are non-empty, show a non-intrusive bottom toast:
    *"NagrikAI wants to remember: occupation = farmer. [✓ Save] [✗ Dismiss] [Edit before saving]"*
  - Each proposal can be individually approved, dismissed, or edited before saving.
  - Multiple proposals shown as a dismissible list (max 3 at once).
- Chat response UI: show a small 🧠 indicator on AI messages that used stored memory in the answer.

**Done when:**
1. After chatting as a farmer, NagrikAI proposes to remember `occupation=farmer` and `land_holding_hectares=1.2` as a toast notification.
2. User clicks ✓ Save → entries appear in the MemoryPanel.
3. On the next session (after logout + login), the AI remembers the farmer profile without being told again.
4. User can edit a memory entry value directly in MemoryPanel.
5. User can delete an entry — subsequent answers no longer use that field.

---

## Phase 11 — Explainability Layer (≈2 hrs)
**Do**

Make AI answers more transparent by showing _why_ the AI said what it said.

- **"Why this answer?" panel:** a collapsible section under each AI message showing:
  - Which memory entries were used in generating this answer (with their source).
  - Which scheme chunks were retrieved (title, page, relevance score).
  - Which eligibility operators fired (and with what values).
  - The intent that was classified.
- **Source highlighting:** when citations are shown, clicking a citation highlights the exact text in the retrieved chunk preview.
- **Memory used badge:** AI messages that relied on stored memory show a small 🧠 icon; hovering shows which fields came from memory vs. the current conversation.
- Backend: include `explanation` object in `ChatResponse`:
  ```json
  {
    "intent": "eligibility",
    "memory_fields_used": ["occupation", "land_holding_hectares"],
    "chunks_retrieved": [{"title": "...", "page": 1, "score": 0.87}],
    "eligibility_operators_fired": [{"criterion": "Owns cultivable land", "op": "gt", "value": 0, "user_value": 1.2, "result": "met"}],
    "language_detected": "hi"
  }
  ```
- Frontend: `ExplainPanel` component — collapsible accordion below each AI bubble, opt-in (default collapsed).

**Done when:** clicking "Why this answer?" on any AI message shows the retrieved chunks, memory fields used, and eligibility breakdown in a readable accordion.

---

## Phase 12 — Final Submission Polish (≈1 hr)
**Do**
- Update README with Phase 9–11 features (landing page, auth, negotiated memory, explainability).
- Run all 17+ backend tests — must all pass.
- Frontend build — 0 TypeScript errors.
- Final commit, tag `final-submission`.
- Record updated demo video (2–3 min) covering landing → login → chat with memory → memory panel → explainability.
- Submit via Challazo form + Google form.

---

## Always
- Commit after every phase with a clear message.
- Never invent scheme facts; use `TODO_VERIFY` and `verified: false`.
- Eligibility decisions stay in code, never in the LLM.
- Keep the chat path fast; no agent loops.
- After each phase, report: what was built, how to run it, what was assumed, what is next.
