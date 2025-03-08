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
    secret:
      process.env.SESSION_SECRET ||
      "6fc6789657d8dd13555373b101413635e2a5ba54112cd97c484a74c00faf7f6c",
  },
  server: {
    port: process.env.PORT || 3000, // Umgebungsvariable für den Port (falls gesetzt)
  },
  jwtSecret:
    process.env.JWT_SECRET ||
    "04e70980c7409bcc822ba7d91d9f77f15f161f26fb76d325407200978a47c466324afff958f2337b7c7f078e39c8d55a654fcc542342f06af2bb787cba782746e1c1ab3b87a1faa14ed1b6d56db7592ee3dc34138ced619590427cfed0d7e3f373bd1c496bacee3434d55d0da79824d8819f0e5a75a7c40f8fc1f40df93fcf6834172518d0760052ec53e33cbb9e751b9e9dbcfe6b3de0e818e9fd68ce3e7a33a88d707e6bcaf31a7cb49dd5cb84c21985e3deb2ddd682bf51bccc800666298af3c758eb37861d1c1268b83bc017cb8bef81440f11b05cee47aefb7e82527009b5ccaf42abec96a66ba264fbddf8ba681b2e715adf94e16f3644b420b7a635d3",
};
