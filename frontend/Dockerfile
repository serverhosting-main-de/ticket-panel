# Verwende ein offizielles Node.js-Image als Basis für das Frontend
FROM node:22.6.0-alpine as build

# Arbeitsverzeichnis im Container erstellen und festlegen
WORKDIR /app

# package.json und package-lock.json in das Arbeitsverzeichnis kopieren
COPY package*.json ./

# Abhängigkeiten installieren
RUN npm install

# Den gesamten Quellcode in das Arbeitsverzeichnis kopieren
COPY . .

# Build-Prozess (für React)
RUN npm run build

# Verwende ein leichtgewichtiges Nginx-Image für die Bereitstellung
FROM nginx:alpine

# Kopiere die Build-Ausgabe von der vorherigen Stufe
COPY --from=build /app/build /usr/share/nginx/html

# Nginx-Konfiguration kopieren (falls erforderlich)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# Port freigeben
EXPOSE 5173

# Nginx starten
CMD ["nginx", "-g", "daemon off;"]