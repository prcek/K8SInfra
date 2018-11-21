FROM debian:stretch-slim


RUN set -x && apt-get update && apt-get install --no-install-recommends --no-install-suggests -y certbot curl

#certbot certonly --standalone  --test-cert -m tomas.hluchan@gmail.com -d do.tsstarlet.net --preferred-challenges http

EXPOSE 80