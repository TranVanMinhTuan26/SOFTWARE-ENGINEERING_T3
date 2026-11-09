FROM node:22-bookworm-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates python3 make g++ && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
RUN npm ci
COPY backend backend
RUN npm run db:generate && npm run build -w backend
WORKDIR /app/backend
ENV NODE_ENV=production
USER node
EXPOSE 4000
CMD ["npm", "run", "start:prod"]
