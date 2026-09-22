FROM node:24.16.0-alpine3.23 AS build

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

COPY index.html vite.config.js ./
COPY public ./public
COPY src ./src

ARG VITE_API_URL=http://localhost:5000

RUN VITE_API_URL="${VITE_API_URL}" npm run build

FROM nginx:1.29.4-alpine3.23 AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 5173

HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=3 \
    CMD ["curl", "--fail", "--silent", "--show-error", "--max-time", "3", "http://127.0.0.1:5173/"]
