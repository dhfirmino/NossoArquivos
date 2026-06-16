FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY tracing.cjs ./
COPY src ./src
EXPOSE 3000
CMD ["node", "-r", "./tracing.cjs", "src/server.js"]
