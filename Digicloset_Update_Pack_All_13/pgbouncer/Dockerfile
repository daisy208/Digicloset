FROM edoburu/pgbouncer:1.16.0
COPY pgbouncer.ini /etc/pgbouncer/pgbouncer.ini
COPY userlist.txt /etc/pgbouncer/userlist.txt
CMD ["/usr/bin/pgbouncer", "/etc/pgbouncer/pgbouncer.ini"]