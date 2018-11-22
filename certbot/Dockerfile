FROM debian:stretch-slim


RUN set -x && apt-get update && apt-get install --no-install-recommends --no-install-suggests -y certbot curl vim gnupg2
RUN curl -LO https://storage.googleapis.com/kubernetes-release/release/$(curl -s https://storage.googleapis.com/kubernetes-release/release/stable.txt)/bin/linux/amd64/kubectl
RUN chmod +x ./kubectl
RUN mv /kubectl /usr/local/bin/kubectl


RUN curl -sL https://deb.nodesource.com/setup_10.x > setup_10.x
RUN chmod +x setup_10.x
RUN ./setup_10.x
RUN apt-get install --no-install-recommends --no-install-suggests -y nodejs
RUN rm -f ./setup_10.x

COPY entry.sh /

EXPOSE 80

#CMD ["/entry.sh"]
CMD exec /bin/bash -c "trap : TERM INT; sleep infinity & wait"