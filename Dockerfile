FROM node:22-bookworm-slim AS dependencies
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates python3 make g++ && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
RUN npm ci

FROM dependencies AS api
COPY backend backend
RUN npm run db:generate && npm run build -w backend
WORKDIR /app/backend
ENV NODE_ENV=production
USER node
EXPOSE 4000
CMD ["npm", "run", "start:prod"]

FROM dependencies AS web
COPY frontend frontend
ARG NEXT_PUBLIC_API_URL=http://localhost:4000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_ENABLE_LOCAL_DEMO_PASSWORD_RESET=false
ENV NEXT_PUBLIC_ENABLE_LOCAL_DEMO_PASSWORD_RESET=$NEXT_PUBLIC_ENABLE_LOCAL_DEMO_PASSWORD_RESET
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build -w frontend && chown -R node:node /app/frontend/.next
WORKDIR /app/frontend
ENV NODE_ENV=production
USER node
EXPOSE 3000
CMD ["npm", "run", "start"]
