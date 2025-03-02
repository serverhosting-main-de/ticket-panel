# Basis-Image für das Backend
FROM node:22.6.0

# Arbeitsverzeichnis für das Backend festlegen
WORKDIR /app/backend

# Kopiere package.json und package-lock.json (falls vorhanden)
COPY backend/package*.json ./

# Installiere die Backend-Abhängigkeiten
RUN npm install

# Kopiere den gesamten Backend-Code
COPY backend/ .

# Exponiere den Port für das Backend (3000)
EXPOSE 3000

# Starte das Backend
CMD ["npm", "start"]
