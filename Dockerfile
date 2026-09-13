FROM node:20-alpine
WORKDIR /app
COPY dist ./dist
COPY server ./server
WORKDIR /app/server
RUN npm install --omit=dev
WORKDIR /app
EXPOSE 3000
ENV PORT=3000
ENV NODE_ENV=production
CMD ["node", "server/server.js"]
