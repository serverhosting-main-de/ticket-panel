# Basis-Image für das Frontend
FROM node:22.6.0

# Arbeitsverzeichnis für das Frontend festlegen
WORKDIR /app/frontend

# Kopiere package.json und package-lock.json (falls vorhanden)
COPY frontend/package*.json ./

# Installiere die Abhängigkeiten
RUN npm install

# Kopiere den Rest des Frontend-Codes
COPY frontend/ ./

# Port für Vite-Entwicklungsserver freigeben
EXPOSE 5173

# Starte den Entwicklungsserver mit Netzwerkzugriff
CMD ["npm", "run", "dev"]
