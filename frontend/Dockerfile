# Mehrstufiger Build zur Optimierung der Image-Größe

# 1. Build-Phase: Abhängigkeiten installieren und Anwendung bauen
FROM node:22.6.0-alpine

WORKDIR /app

# package.json und package-lock.json kopieren
COPY package*.json ./

# Abhängigkeiten installieren und package-lock.json erstellen
RUN npm install

# Quellcode kopieren
COPY . ./

EXPOSE 5173
# Anwendung bauen
RUN npm run start
