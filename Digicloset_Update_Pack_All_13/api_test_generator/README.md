GPT-driven API Test Case Generator.

This script loads an OpenAPI (Swagger) JSON or YAML file and uses GPT (OpenAI) to generate pytest test cases.
It is a helper that will output a tests/ folder with generated test files.

Usage:
- Set OPENAI_API_KEY in .env
- pip install openai pyyaml python-dotenv
- python generate_api_tests.py --openapi ./openapi.json --out ./generated_tests
