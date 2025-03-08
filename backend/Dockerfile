# Verwende Node.js 22.6.0 als Basis-Image
FROM node:22.6.0-alpine

# Arbeitsverzeichnis im Container erstellen und festlegen
WORKDIR /app

# package.json und package-lock.json in das Arbeitsverzeichnis kopieren
COPY package*.json ./

# Abhängigkeiten installieren
RUN npm install

# Den gesamten Quellcode in das Arbeitsverzeichnis kopieren
COPY . .

# Umgebungsvariablen werden jetzt von Docker Compose geladen (env_file)

# Port 3000 freigeben, auf dem die Anwendung läuft
EXPOSE 3000

# Anwendung starten
CMD ["node", "server.js"]