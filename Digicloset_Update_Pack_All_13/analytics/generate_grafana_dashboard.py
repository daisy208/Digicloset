#!/usr/bin/env python3
import os, sys, json, requests
from dotenv import load_dotenv
load_dotenv()

GRAFANA_URL = os.getenv('GRAFANA_URL')
GRAFANA_API_KEY = os.getenv('GRAFANA_API_KEY')

if not GRAFANA_URL or not GRAFANA_API_KEY:
    print('Set GRAFANA_URL and GRAFANA_API_KEY in .env'); sys.exit(1)

dash = {
    'dashboard': {
        'title': 'Digicloset Auto Dashboard',
        'panels': []
    },
    'overwrite': True
}

r = requests.post(f"{GRAFANA_URL}/api/dashboards/db", json=dash, headers={'Authorization': f'Bearer {GRAFANA_API_KEY}'})
print(r.status_code, r.text)
