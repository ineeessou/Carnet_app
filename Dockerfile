FROM node:20-alpine
WORKDIR /app
COPY package.json server.js ./
COPY public ./public
COPY exemple ./exemple
ENV PORT=8080 DATA_DIR=/data NODE_ENV=production
VOLUME ["/data"]
EXPOSE 8080
HEALTHCHECK --interval=60s --timeout=5s CMD wget -qO- http://localhost:8080/api/health || exit 1
CMD ["node", "server.js"]
