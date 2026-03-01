FROM node:20-alpine AS builder
WORKDIR /app

# Copy workspace config and package files
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY backend/package.json ./backend/

# Stub frontend so npm workspaces doesn't complain
RUN mkdir -p frontend && echo '{"name":"frontend","private":true}' > frontend/package.json

RUN npm ci

# Copy source and build
COPY tsconfig.base.json ./
COPY packages/shared/src ./packages/shared/src
COPY packages/shared/tsconfig.json ./packages/shared/
COPY backend/src ./backend/src
COPY backend/tsconfig.json ./backend/

RUN npm run build -w packages/shared && npm run build -w backend

# Remove dev dependencies and source files
RUN npm prune --omit=dev
RUN rm -rf packages/shared/src backend/src tsconfig.base.json \
    backend/tsconfig.json packages/shared/tsconfig.json

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app ./

EXPOSE 4000
CMD ["node", "backend/dist/index.js"]
