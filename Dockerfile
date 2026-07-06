FROM node:24-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY package.json ./
COPY *.mjs ./
COPY prototype ./prototype
COPY docs ./docs
COPY README.md LICENSE SECURITY.md CONTRIBUTING.md CHANGELOG.md ./

RUN mkdir -p /app/data

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/healthz').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.mjs"]
