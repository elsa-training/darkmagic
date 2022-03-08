#!/usr/bash

export BASE_IMAGE=debian:bullseye-slim
export NODE_VERSION=16.14.0

echo $BASE_IMAGE
echo $NODE_VERSION
echo $USER
echo $USER_GROUP

docker build -t elsa -f docker.base/Dockerfile \
  --progress=plain \
  --build-arg BASE_IMAGE=$BASE_IMAGE \
  --build-arg NODE_VERSION=$NODE_VERSION \
  --build-arg USER=$USER \
  --build-arg USER_GROUP=$USER_GROUP \
  .
