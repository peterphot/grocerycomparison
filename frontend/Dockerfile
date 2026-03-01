FROM node:20-alpine AS builder
WORKDIR /app

# Copy workspace config and package files
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY frontend/package.json ./frontend/

# Stub backend so npm workspaces doesn't complain
RUN mkdir -p backend && echo '{"name":"backend","private":true}' > backend/package.json

RUN npm ci

# Copy source and build
COPY tsconfig.base.json ./
COPY packages/shared/ ./packages/shared/
COPY frontend/ ./frontend/

RUN npm run build -w packages/shared
RUN npm run build -w frontend

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

# Copy Next.js standalone output
COPY --from=builder /app/frontend/.next/standalone ./
COPY --from=builder /app/frontend/.next/static ./frontend/.next/static

# Next.js standalone needs to listen on all interfaces
ENV HOSTNAME="0.0.0.0"
EXPOSE 3000
CMD ["node", "frontend/server.js"]
