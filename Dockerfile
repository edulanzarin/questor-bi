# syntax=docker/dockerfile:1

# ---- deps: instala node_modules a partir do lockfile ----
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- builder: gera o .next/standalone ----
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# O build não acessa banco: as rotas de API são dinâmicas e só conectam em runtime.
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---- runner: só o que roda em produção ----
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# server.js do standalone escuta aqui; a porta externa quem mapeia é o compose.
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# pdftotext: extrai o texto dos extratos em PDF preservando as colunas.
RUN apk add --no-cache poppler-utils

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# O standalone já traz o node_modules mínimo (inclusive o pg).
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
# public e .next/static não vêm no standalone — precisam ser copiados à mão.
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Migrations do banco próprio, aplicadas no boot pelo entrypoint.
COPY --chown=nextjs:nodejs migrations ./migrations
COPY --chown=nextjs:nodejs scripts ./scripts
COPY --chown=nextjs:nodejs docker-entrypoint.sh ./
# Remove CR (caso o host tenha feito checkout CRLF, ex.: Windows/autocrlf) para
# o shebang não virar "/bin/sh\r", e garante o bit executável no próprio build.
RUN sed -i 's/\r$//' docker-entrypoint.sh && chmod +x docker-entrypoint.sh

USER nextjs
EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]
