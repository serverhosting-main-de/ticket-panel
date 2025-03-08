require("dotenv").config();
const express = require("express");
const axios = require("axios");
const session = require("express-session");
const cors = require("cors");

const app = express();
const port = 3000;

app.use(
  cors({
    origin: "https://tickets.wonder-craft.de",
    credentials: true,
  })
);

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: "auto", // oder true in production
      sameSite: "none",
      httpOnly: true,
    },
  })
);

app.get("/login", (req, res) => {
  const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&redirect_uri=https%3A%2F%2Fbackendtickets.wonder-craft.de%2Fcallback&response_type=code&scope=identify`;
  res.redirect(discordAuthUrl);
});

app.get("/callback", async (req, res) => {
  const { code } = req.query;

  try {
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

    const userResponse = await axios.get("https://discord.com/api/users/@me", {
      headers: { authorization: `Bearer ${access_token}` },
    });

    req.session.userId = userResponse.data.id;
    req.session.username = userResponse.data.username;

    res.redirect(
      `https://tickets.wonder-craft.de/?userId=${req.session.userId}&username=${req.session.username}`
    );
  } catch (error) {
    console.error("Discord-Authentifizierung fehlgeschlagen:", error.message);
    if (error.response && error.response.status === 401) {
      res.status(401).send("Ungültige Anmeldeinformationen");
    } else {
      res.status(500).send("Authentifizierung fehlgeschlagen" + error.message);
      console.error("Authentifizierung fehlgeschlagen:", error.message);
    }
  }
});

app.listen(port, () => {
  console.log(`Backend läuft auf Port ${port}`);
});
