FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate && npm run build
ENV NODE_ENV=production
EXPOSE 4000
CMD ["npm","run","start:prod"]
