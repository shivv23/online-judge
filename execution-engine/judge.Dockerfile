# Multi-language judge image. The compiler service can run either this combined
# image or the individual official images defined in docker-compose.yml.
#
# Build with:  docker compose -f execution-engine/docker-compose.yml build judge
# Pull all runtimes with:  docker compose -f execution-engine/docker-compose.yml pull
FROM ubuntu:24.04

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    python3 \
    nodejs \
    openjdk-21-jdk-headless \
    && rm -rf /var/lib/apt/lists/*

RUN useradd -m -u 1000 judge
USER judge
WORKDIR /workspace
