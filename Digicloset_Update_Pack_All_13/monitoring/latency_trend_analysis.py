#!/usr/bin/env python3
"""Fetch a latency series from Prometheus and compute simple moving average and trend."""
import os, sys, requests, statistics
from dotenv import load_dotenv
load_dotenv()
PROM_URL = os.getenv('PROMETHEUS_URL', 'http://prometheus:9090')

def fetch_latency(query, start, end):
    r = requests.get(f"{PROM_URL}/api/v1/query_range", params={'query': query, 'start': start, 'end': end, 'step': '15s'})
    r.raise_for_status()
    return r.json()

def sma(values, n=10):
    if len(values) < n:
        return statistics.mean(values)
    return sum(values[-n:]) / n

if __name__ == '__main__':
    import time, datetime as dt
    end = dt.datetime.utcnow().timestamp()
    start = end - 3600
    res = fetch_latency('http_request_duration_seconds_bucket{job="backend"}', start, end)
    print('Fetched; parse and compute moving average as needed.')
