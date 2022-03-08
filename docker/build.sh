#!/usr/bash

docker build -t elsaapp:${APP_VERSION} -f docker/Dockerfile \
  --progress=plain \
  .
