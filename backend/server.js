require("dotenv").config();
const express = require("express");
const axios = require("axios");
const session = require("express-session");
const cors = require("cors");
const { Client, GatewayIntentBits } = require("discord.js");
const fs = require("fs").promises;
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const port = 3000;

// HTTP Server für Socket.io
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "https://tickets.wonder-craft.de",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Discord-Bot initialisieren
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
  ],
});

client.once("ready", () => {
  console.log(`Discord-Bot eingeloggt als ${client.user.tag}!`);
});

client.login(process.env.DISCORD_TOKEN);

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
      secure: true,
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
    const avatarHash = userResponse.data.avatar;
    const userIdDiscord = userResponse.data.id;
    const avatarUrl = avatarHash
      ? `https://cdn.discordapp.com/avatars/${userIdDiscord}/${avatarHash}.png`
      : null;

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

// Rolle prüfen und Online-Status abrufen
app.get("/check-role/:userId", async (req, res) => {
  const { userId } = req.params;
  const guildId = process.env.GUILD_ID;
  const requiredRoleName = process.env.REQUIRED_ROLE;

  try {
    const guild = await client.guilds.fetch(guildId);
    const member = await guild.members.fetch(userId);

    if (member) {
      const hasRequiredRole = member.roles.cache.some(
        (role) => role.name === requiredRoleName
      );
      const status = member.presence ? member.presence.status : "offline";

      res.json({ hasRole: hasRequiredRole, status: status });
    } else {
      res.status(404).json({ error: "Benutzer nicht gefunden." });
    }
  } catch (error) {
    console.error(
      "Fehler beim Abrufen der Benutzerrolle und des Status:",
      error
    );
    res.status(500).json({ error: "Serverfehler." });
  }
});

// Ticket-Dateien abrufen
app.get("/tickets", async (req, res) => {
  const ticketsDir = "/app/tickets";

  try {
    const files = await fs.readdir(ticketsDir);
    const ticketFiles = files.filter((file) => file.endsWith(".html"));
    const tickets = ticketFiles.map((file) => ({
      fileName: file,
      title: file.replace(".html", "").replace(/_/g, " "),
      date: new Date().toLocaleDateString(),
    }));

    res.json(tickets);
  } catch (error) {
    console.error("Fehler beim Lesen der Ticket-Dateien:", error);
    res.status(500).json({ error: "Serverfehler." });
  }
});

app.get("/ticket-content/:fileName", async (req, res) => {
  const { fileName } = req.params;
  const filePath = path.join("/app/tickets", fileName);

  try {
    const content = await fs.readFile(filePath, "utf8");
    res.send(content);
  } catch (error) {
    console.error("Fehler beim Lesen des Ticket-Inhalts:", error);
    res.status(500).send("Fehler beim Lesen des Ticket-Inhalts.");
  }
});

// WebSocket-Verbindung
const ticketViewers = {};
const userAvatars = {}; // Objekt zum Speichern der Avatar-Hashes

io.on("connection", (socket) => {
  console.log("Client verbunden");

  socket.on("ticketOpened", (ticketId, userId, avatarHash) => {
    if (!ticketViewers[ticketId]) {
      ticketViewers[ticketId] = []; // Korrigierte Zeile
    }
    if (!ticketViewers[ticketId].includes(userId)) {
      ticketViewers[ticketId].push(userId);
      userAvatars[userId] = avatarHash; // Avatar-Hash speichern
    }
    io.emit(
      "updateTicketViewers",
      ticketId,
      ticketViewers[ticketId],
      userAvatars
    ); // userAvatars senden
  });

  socket.on("ticketClosed", (ticketId, userId) => {
    if (ticketViewers[ticketId]) {
      ticketViewers[ticketId] = ticketViewers[ticketId].filter(
        (id) => id !== userId
      );
      io.emit(
        "updateTicketViewers",
        ticketId,
        ticketViewers[ticketId],
        userAvatars
      ); // userAvatars senden
    }
  });

  socket.on("disconnect", () => {
    console.log("Client getrennt");
  });
});

// Server starten
server.listen(port, () => {
  console.log(`Backend läuft auf Port ${port}`);
});
