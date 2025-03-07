// config.js
export const config = {
  discord: {
    // Umgebungsvariablen werden bevorzugt, falls nicht gesetzt, werden Standardwerte verwendet
    clientID: process.env.DISCORD_CLIENT_ID || "1219019749443506266",
    clientSecret:
      process.env.DISCORD_CLIENT_SECRET || "FsNeHFTqDPQA23IkFuOzXnfvZpeS8Zub",
    // Verwende die Umgebungsvariable für die Callback-URL oder den Standardwert
    callbackURL:
      process.env.DISCORD_CALLBACK_URL ||
      "http://backendtickets.wonder-craft.de/auth/discord/callback",
    scope: ["identify"],
  },
  session: {
    // Sichere Session-Secret, entweder von Umgebungsvariablen oder Standardwert
    secret: process.env.SESSION_SECRET || "super-secret-key",
  },
  server: {
    port: process.env.PORT || 3000, // Umgebungsvariable für den Port (falls gesetzt)
  },
};
