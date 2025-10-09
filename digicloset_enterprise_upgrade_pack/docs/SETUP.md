# Developer Setup (Digicloset)

## Prerequisites
- Python 3.11
- pipenv/virtualenv or poetry
- Docker (optional, for building images)
- Node (if frontend tooling is required)

## Quickstart
1. Copy environment template:
   ```bash
   cp .env.example .env
   # fill .env with your values (SUPABASE_URL, JWT_SECRET, etc.)
   ```
2. Create virtual env and install dependencies:
   ```bash
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```
3. Run the service locally (example for FastAPI/uvicorn):
   ```bash
   uvicorn backend.ai_service:app --reload --host 0.0.0.0 --port 3000
   ```
4. Run tests:
   ```bash
   pip install -r requirements-dev.txt
   pytest -q
   ```