require("dotenv").config();
const express = require("express");
const axios = require("axios");
const session = require("express-session");
const cors = require("cors");
const app = express();
const port = 3000;

// CORS-Konfiguration
app.use(
  cors({
    origin: "https://tickets.wonder-craft.de",
    credentials: true,
  })
);

// Session-Konfiguration
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: true, // In Produktion immer true setzen
      sameSite: "none",
      httpOnly: true,
    },
  })
);

// Login-Route
app.get("/login", (req, res) => {
  const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&redirect_uri=https%3A%2F%2Fbackendtickets.wonder-craft.de%2Fcallback&response_type=code&scope=identify`;
  res.redirect(discordAuthUrl);
});

// Callback-Route
app.get("/callback", async (req, res) => {
  const { code } = req.query;

  try {
    // Token-Anfrage an Discord
    const tokenResponse = await axios.post(
      "https://discord.com/api/oauth2/token",
      new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID,
        client_secret: process.env.DISCORD_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: "https://backendtickets.wonder-craft.de/callback",
      }),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );

    const { access_token } = tokenResponse.data;

    // Benutzerdaten von Discord abrufen
    const userResponse = await axios.get("https://discord.com/api/users/@me", {
      headers: { authorization: `Bearer ${access_token}` },
    });

    req.session.userId = userResponse.data.id;
    req.session.username = userResponse.data.username;
    const avatarHash = userResponse.data.avatar;
    const userIdDiscord = userResponse.data.id;
    const avatarUrl = avatarHash
      ? `https://cdn.discordapp.com/avatars/${userIdDiscord}/${avatarHash}.png`
      : null;

    // Weiterleitung zur Dashboard-Seite mit Benutzerdaten
    res.redirect(
      `https://tickets.wonder-craft.de/dashboard/?userId=${req.session.userId}&username=${req.session.username}&avatar=${avatarUrl}`
    );
  } catch (error) {
    console.error("Discord-Authentifizierung fehlgeschlagen:", error.message);
    if (error.response && error.response.status === 401) {
      res.status(401).send("Ungültige Anmeldeinformationen");
    } else {
      res
        .status(500)
        .send("Authentifizierung fehlgeschlagen: " + error.message);
    }
  }
});

// Server starten
app.listen(port, () => {
  console.log(`Backend läuft auf Port ${port}`);
});
