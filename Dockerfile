FROM ubuntu:22.04
RUN apt-get update && apt-get install -y \
    python3 gcc g++ openjdk-17-jdk \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app