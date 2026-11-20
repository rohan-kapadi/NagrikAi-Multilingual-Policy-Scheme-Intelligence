# NagrikAI

> AI-powered government scheme discovery and policy intelligence platform. Making government benefits understandable, accessible, and actionable for every citizen in **English, Hindi, and Marathi**.

Built for **IDEA//FORGE Online Hackathon** — Track 1 (Civic Pulse, Digital Governance & Public Information), Problem 1: *Multilingual Policy, Rights & Scheme Explainer*.

---

## Quick Start

### 1. Backend Setup
```bash
# From repository root
cd backend
# Activate virtual environment
.\venv\Scripts\activate   # On Windows
# source venv/bin/activate # On Linux/macOS

# Install dependencies
pip install -r requirements.txt

# Run backend development server
uvicorn backend.app.main:app --reload --port 8000
```
API health check is available at: [http://localhost:8000/api/health](http://localhost:8000/api/health)
Swagger API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)

### 2. Frontend Setup
```bash
# In another terminal
cd frontend
npm install
npm run dev
```
Frontend runs at: [http://localhost:5173](http://localhost:5173)

---

## Environment Variables
Copy `.env.example` to `.env` in the root:
```bash
cp .env.example .env
```
Configure your `GROQ_API_KEY` or `GEMINI_API_KEY`.
