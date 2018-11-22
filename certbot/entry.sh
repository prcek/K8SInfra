#!/bin/bash

#if [[ -z $EMAIL || -z $DOMAINS || -z $SECRET || -z $DEPLOYMENT ]]; then
#	echo "EMAIL, DOMAINS, SECERT, and DEPLOYMENT env vars required"
#	env
#	exit 1
#fi


certbot certonly --standalone  --test-cert -m tomas.hluchan@gmail.com -d www.prcek.io -d do.tsstarlet.net --preferred-challenges http -n --agree-tos


NAMESPACE=$(cat /var/run/secrets/kubernetes.io/serviceaccount/namespace)
TOKEN=$(cat /var/run/secrets/kubernetes.io/serviceaccount/token)
CACERT="/var/run/secrets/kubernetes.io/serviceaccount/ca.crt"
curl --cacert $CACERT  -H "Authorization: Bearer $TOKEN"  https://kubernetes/api/v1/services

#certbot certonly --standalone  --test-cert  -n --agree-to -m tomas.hluchan@gmail.com -d do.tsstarlet.net --preferred-challenges http
