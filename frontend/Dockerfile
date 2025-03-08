# Build-Stage: Frontend-Assets für die Produktion erstellen
FROM node:22.6.0 AS build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build # Oder dein Build-Skript

# Serve-Stage: Statische Assets mit Node.js ausliefern
FROM node:22.6.0
WORKDIR /app
COPY --from=build /app/frontend/dist /app/dist
RUN npm install -g serve
EXPOSE 5173
CMD ["serve", "-s", "dist", "-l", "5173"]