#!/bin/sh
set -e
sed -i'' "s|__BACKEND_API_URL__|${BACKEND_API_URL}|g" /usr/share/nginx/html/env.js