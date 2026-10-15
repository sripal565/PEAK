FROM node:24-bookworm-slim
WORKDIR /app
COPY package*.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/mobile/package.json ./apps/mobile/package.json
RUN npm ci --workspace @movement/api --include-workspace-root --ignore-scripts
COPY packages ./packages
COPY apps/api ./apps/api
USER node
ENV NODE_ENV=production
EXPOSE 8080
CMD ["node", "--experimental-strip-types", "apps/api/src/main.ts"]
