# Build-Stage: Frontend-Assets für die Produktion erstellen
FROM node:22.6.0 AS build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build # Oder dein Build-Skript

# Nginx-Stage: Statische Assets mit Nginx ausliefern
FROM nginx:alpine
COPY --from=build /app/frontend/dist /usr/share/nginx/html
EXPOSE 5173
CMD ["nginx", "-g", "daemon off;"]