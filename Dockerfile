# Node 24.22.1 includes the October 2026 security fixes. Keep the digest
# pinned so rebuilds cannot silently move to a different image.
FROM node:24.22.1-slim@sha256:55fb5f5a527ea2c5c4a95f963e48ef90aa38c7b346054fdc8ee9957a2b55d205 AS build

WORKDIR /app

# Install the audited build toolchain before copying the relay source.
COPY mcp/package.json mcp/package-lock.json* ./mcp/
COPY mcp/scripts/postinstall.js ./mcp/scripts/postinstall.js
RUN cd mcp && npm ci

COPY mcp/mcp-server.js ./mcp/mcp-server.js
COPY mcp/scripts/build.js ./mcp/scripts/build.js
RUN cd mcp && npm run build

FROM node:24.22.1-slim@sha256:55fb5f5a527ea2c5c4a95f963e48ef90aa38c7b346054fdc8ee9957a2b55d205

WORKDIR /app

COPY --from=build /app/mcp/dist/mcp-server.cjs ./mcp/dist/mcp-server.cjs
COPY mcp/package.json ./mcp/package.json

# Glama and Docker MCP inspect the bundled server through stdio.
ENTRYPOINT ["node", "mcp/dist/mcp-server.cjs"]
