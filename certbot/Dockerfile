FROM debian:stretch-slim


RUN set -x && apt-get update && apt-get install --no-install-recommends --no-install-suggests -y certbot curl vim


COPY entry.sh /

EXPOSE 80

#CMD ["/entry.sh"]
CMD exec /bin/bash -c "trap : TERM INT; sleep infinity & wait"