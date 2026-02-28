# GroceryCompare

Compare grocery prices across Australian supermarkets (Woolworths, Coles, Aldi, Harris Farm).

## Prerequisites

- Node.js 20+
- npm 10+

## Getting Started

```bash
# Install all dependencies (root + workspaces)
npm install

# Start both frontend and backend in development mode
npm run dev
```

The frontend runs at [http://localhost:3000](http://localhost:3000) and the backend at [http://localhost:4000](http://localhost:4000).

## Scripts

| Command            | Description                                      |
| ------------------ | ------------------------------------------------ |
| `npm run dev`      | Start frontend and backend concurrently          |
| `npm run test`     | Run unit tests across all workspaces             |
| `npm run test:e2e` | Run Playwright end-to-end tests                  |
| `npm run build`    | Build all workspaces                             |

## Project Structure

```
grocerycomparison/
├── packages/shared/   # Shared types and utilities (@grocery/shared)
├── backend/           # Express API server (port 4000)
├── frontend/          # Next.js frontend (port 3000)
├── e2e/               # Playwright end-to-end tests
└── docs/              # Requirements, plans, and decisions
```

## Environment Variables

Copy the example env files and adjust as needed:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```
