Integration tests to verify the end-to-end flow (frontend -> backend -> AI -> DB).
These are pytest templates that hit HTTP endpoints and validate expected responses.

Usage:
- Set URLs in .env
- pip install pytest requests python-dotenv
- Run: pytest -q
