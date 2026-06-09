FROM node:20-bookworm-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install --omit=dev

RUN npx playwright install --with-deps chromium

COPY . .

EXPOSE 5000

CMD ["node", "--import", "./instrument.js", "server.js"]
