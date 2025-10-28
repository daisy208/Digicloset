#!/usr/bin/env python3
import os, asyncio, argparse, time
from dotenv import load_dotenv
import aiohttp
from tqdm import tqdm

load_dotenv()
ENDPOINT = os.getenv('INFERENCE_ENDPOINT')
if not ENDPOINT:
    raise SystemExit('Set INFERENCE_ENDPOINT in .env')

async def worker(session, q, results):
    while True:
        item = await q.get()
        if item is None:
            break
        t0 = time.time()
        async with session.post(ENDPOINT, json=item) as resp:
            status = resp.status
            await resp.text()
        t1 = time.time()
        results.append((status, t1-t0))
        q.task_done()

async def main(concurrency, total):
    q = asyncio.Queue()
    # example payload; adapt to your model input
    for i in range(total):
        q.put_nowait({'image_id': i, 'params': {'quality':'low'}})
    async with aiohttp.ClientSession() as session:
        results = []
        workers = [asyncio.create_task(worker(session, q, results)) for _ in range(concurrency)]
        await q.join()
        for w in workers:
            w.cancel()
    ok = [r for r in results if r[0] == 200]
    print(f'Requests: {len(results)}, OK: {len(ok)}, avg latency: {sum(r[1] for r in results)/len(results):.3f}s')

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--concurrency', type=int, default=5)
    parser.add_argument('--requests', type=int, dest='total', default=50)
    args = parser.parse_args()
    asyncio.run(main(args.concurrency, args.total))
