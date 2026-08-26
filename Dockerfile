# Runs anywhere Docker does — Render, a VPS, your own machine.
FROM node:22-slim
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends python3 build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

ENV NODE_ENV=production
ENV DATABASE_PATH=/data/pesu.db
VOLUME /data
EXPOSE 3000

# Seed at start: the volume is only present at runtime.
CMD ["sh", "-c", "npm run seed && npm start"]
