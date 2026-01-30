FROM ubuntu:22.04

# 1. Install compilers (C++, Python, Java) AND Node.js
RUN apt-get update && apt-get install -y \
    python3 gcc g++ openjdk-17-jdk \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 2. Copy dependency files first (for better caching)
COPY package*.json ./
COPY server/package*.json ./server/

# 3. Install dependencies
RUN npm install
# If your server folder has its own package.json, install those too:
RUN cd server && npm install

# 4. Copy the rest of your project files
COPY . .

# 5. Expose the port (Render uses 10000 by default)
EXPOSE 10000

# 6. Start the server
CMD ["node", "server/index.js"]