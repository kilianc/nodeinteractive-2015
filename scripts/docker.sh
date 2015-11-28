#!/bin/sh

# exit on firs error
set -e

# build and run docker image
docker build -t lukibear/nodeinteractive .
docker run --rm -p 80:80 --name nodeinteractive lukibear/nodeinteractive
