# Mehrstufiger Build zur Optimierung der Image-Größe

# 1. Build-Phase: Abhängigkeiten installieren und Anwendung bauen
FROM node:22.6.0-alpine AS build

WORKDIR /app

# package.json und package-lock.json kopieren
COPY package*.json ./

# Abhängigkeiten installieren (Cache nutzen)
RUN npm ci --force

# Quellcode kopieren
COPY . ./

# Anwendung bauen
RUN npm run build

# 2. Produktionsphase: Nginx-Server bereitstellen
FROM nginx:alpine

# Build-Artefakte von der Build-Phase kopieren
COPY --from=build /app/build /usr/share/nginx/html

# Nginx-Konfiguration kopieren (falls erforderlich)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# Port freigeben
EXPOSE 5173

# Nginx starten
CMD ["nginx", "-g", "daemon off;"]