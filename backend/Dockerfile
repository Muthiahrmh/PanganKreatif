# backend/Dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
# Jika pakai prisma, copy foldernya
COPY prisma ./prisma/ 

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Generate Prisma Client (Hapus baris ini jika tidak pakai Prisma)
RUN npx prisma generate

# Build TypeScript (Hapus baris ini jika backend tidak pakai TypeScript)
# RUN npm run build

# Ekspos port backend (Pastikan sesuai dengan port express, misal 8003)
EXPOSE 8003

# Command untuk start backend (sesuaikan dengan script start di package.json Anda)
CMD ["npm", "run", "start"]
