FROM ubuntu:22.04

# 1. Install all runtimes and compilers
RUN apt-get update && apt-get install -y \
    python3 gcc g++ openjdk-17-jdk \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 2. Build the Frontend (code-collaborator)
COPY code-collaborator/package*.json ./code-collaborator/
RUN cd code-collaborator && npm install
COPY code-collaborator/ ./code-collaborator/
RUN cd code-collaborator && npm run build

# 3. Setup the Backend (server)
COPY server/package*.json ./server/
RUN cd server && npm install
COPY server/ ./server/

# 4. Final Prep
EXPOSE 10000

# Start the backend
CMD ["node", "server/index.js"]