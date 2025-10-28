DB folder contents and instructions.

Files:
- migration_check.py         : checks if Alembic migrations are applied and warns about divergent heads.
- schema_version_table.sql   : SQL to create a schema version tracking table for manual tracking.
- data_consistency_checks.py : simple set of checks to compare Supabase tables / counts / checksums.

Usage:
1. Fill `.env` from root `.env.example`
2. Install deps:
   pip install psycopg2-binary sqlalchemy alembic supabase requests python-dotenv
3. Run each script:
   python migration_check.py
   python data_consistency_checks.py
