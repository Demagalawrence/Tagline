FROM node:20-alpine AS base

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

EXPOSE 8081

CMD ["n", "expo", "start", "--web", "--port", "8081", "--non-interactive"]
