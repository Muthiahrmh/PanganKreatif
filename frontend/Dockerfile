# frontend/Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

# Copy built assets dari stage builder
COPY --from=builder /app/package.json .
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Ekspos port frontend (Port bawaan Next.js adalah 3000, tapi kita bisa pakai 8002)
EXPOSE 8002
ENV PORT 8002

CMD ["npm", "run", "start"]
