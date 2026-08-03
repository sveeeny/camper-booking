FROM node:22-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
  chromium \
  fonts-liberation \
  --no-install-recommends && \
  apt-get clean && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_DOWNLOAD=true

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
