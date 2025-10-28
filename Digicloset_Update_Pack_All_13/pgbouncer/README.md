PGbouncer sample for connection pooling.

Files:
- pgbouncer.ini  : basic configuration
- userlist.txt   : credentials placeholder
- Dockerfile     : small image to run pgbouncer

Usage:
1. Build docker: docker build -t pgbouncer:local .
2. Mount pgbouncer.ini and userlist into the container or use envsubst for credentials.
