GPU Inference Load Test

This folder contains an asyncio-based load generator that repeatedly hits your inference endpoint.
It is intentionally simple so you can adjust concurrency and payload size for GPU inference testing.

Usage:
- Set INFERENCE_ENDPOINT in .env
- pip install aiohttp python-dotenv tqdm
- python gpu_load_test.py --concurrency 10 --requests 100
