# Frontend Dockerfile — multi-stage (build with Node, serve with nginx)

# ---- Build stage ----
FROM node:18-alpine AS build
WORKDIR /app

# CRA bakes REACT_APP_* variables at BUILD time, so they must be present
# as build args / env before "npm run build" runs.
ARG REACT_APP_API_URL=http://localhost:5000/api
ARG REACT_APP_SOCKET_URL=http://localhost:5000
ARG REACT_APP_NAME=NexusAdmin
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV REACT_APP_SOCKET_URL=$REACT_APP_SOCKET_URL
ENV REACT_APP_NAME=$REACT_APP_NAME

COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# ---- Serve stage ----
FROM nginx:1.27-alpine
# SPA-aware nginx config (history-API fallback to index.html)
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
