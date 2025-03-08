# Mehrstufiger Build zur Optimierung der Image-Größe
# 1. Build-Phase: Abhängigkeiten installieren und Anwendung bauen
FROM node:22.6.0-alpine AS build

WORKDIR /app

# package.json und package-lock.json kopieren
COPY package*.json ./

# Abhängigkeiten installieren und package-lock.json erstellen
RUN npm install

# Quellcode kopieren
COPY . ./

# Anwendung bauen
RUN npm run build

# 2. Produktionsphase: Produktionsserver bereitstellen
FROM node:22.6.0-alpine

WORKDIR /app

# Build-Artefakte von der Build-Phase kopieren
COPY --from=build /app/build ./build

# Produktionsserver installieren
RUN npm install -g serve

# Port freigeben
EXPOSE 5173

# Produktionsserver starten
CMD ["serve", "-s", "build", "-l", "5173"]