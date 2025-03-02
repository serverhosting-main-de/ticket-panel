# Basis-Image für das Frontend
FROM node:22.6.0

# Arbeitsverzeichnis für das Frontend festlegen
WORKDIR /app/frontend

# Kopiere package.json und package-lock.json (falls vorhanden)
COPY frontend/package*.json ./

# Installiere die Frontend-Abhängigkeiten
RUN npm install

# Baue das Frontend (für die Produktion)
RUN npm run build

# Exponiere den Port für das Frontend (5173)
EXPOSE 5173

# Starte das Frontend
CMD ["npm", "run", "dev"]
