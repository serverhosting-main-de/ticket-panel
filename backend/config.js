// config.js
export const config = {
  discord: {
    clientID: process.env.DISCORD_CLIENT_ID || "1219019749443506266",
    clientSecret:
      process.env.DISCORD_CLIENT_SECRET || "FsNeHFTqDPQA23IkFuOzXnfvZpeS8Zub",
    callbackURL: "http://tickets.wonder-craft.de:3000/auth/discord/callback", // Deine Callback-URL
    scope: ["identify"],
  },
  session: {
    secret: process.env.SESSION_SECRET || "super-secret-key", // Verwende ein sicheres Secret
  },
  server: {
    port: 3000,
  },
};
