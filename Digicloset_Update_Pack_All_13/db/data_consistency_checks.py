#!/usr/bin/env python3
"""Simple data consistency checks between related tables (Supabase/Postgres)."""
import os, sys
import hashlib
from dotenv import load_dotenv
import requests

load_dotenv()
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')
DATABASE_URL = os.getenv('DATABASE_URL')

if not SUPABASE_URL or not SUPABASE_KEY:
    print('Please set SUPABASE_URL and SUPABASE_KEY in .env')
    sys.exit(1)

def checksum_string(s: str):
    return hashlib.md5(s.encode('utf-8')).hexdigest()

def fetch_table_count(table):
    url = f"{SUPABASE_URL}/rest/v1/{table}?select=id&limit=0&count=exact"
    headers = {'apikey': SUPABASE_KEY, 'Authorization': f'Bearer {SUPABASE_KEY}'}
    r = requests.get(url, headers=headers)
    if r.status_code in (200, 206):
        count = r.headers.get('x-total-count') or r.json().__len__()  # depends on Supabase response mode
        return int(count)
    else:
        print('Failed to fetch', table, r.status_code, r.text[:200])
        return None

def main():
    tables = ['users', 'profiles', 'orders', 'products']
    for t in tables:
        c = fetch_table_count(t)
        print(f'Table {t}: count =', c)

    # Placeholder: more advanced checks can compute row checksums by paging through records and comparing with DB

if __name__ == '__main__':
    main()
