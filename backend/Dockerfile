FROM node:20-alpine AS base

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

FROM base AS development
EXPOSE 3000
CMD ["npm", "run", "start:dev"]

FROM base AS production
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "start:prod"]