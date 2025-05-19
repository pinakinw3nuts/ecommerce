FROM node:18-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
COPY ../../pnpm-workspace.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY . .

RUN pnpm build || true

CMD ["pnpm", "exec", "ts-node", "src/server.ts"] 