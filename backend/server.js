require("dotenv").config();
const express = require("express");
const axios = require("axios");
const session = require("express-session");
const cors = require("cors");
const { Client, GatewayIntentBits, Partials } = require("discord.js");
const http = require("http");
const { Server } = require("socket.io");
const { MongoClient, ObjectId } = require("mongodb");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;

// --- HTTP Server & Socket.IO ---
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "https://tickets.wonder-craft.de", // Erlaube nur dein Frontend
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// --- MongoDB-Verbindung ---
const mongoUrl = process.env.MONGO_URL;
const dbName = "Serverhosting"; // Deine Datenbank
let db;

async function sendTicketUpdates() {
  try {
    const tickets = await db
      .collection("TicketSystem")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    const formattedTickets = tickets.map((ticket) => ({
      title: ticket.category ? `${ticket.category} Ticket` : "Ticket",
      date: ticket.createdAt,
      threadID: ticket.threadID,
      creator: ticket.creator,
      creatorID: ticket.creatorID,
      category: ticket.category,
      status: ticket.status,
      claimedBy: ticket.claimedBy || "-",
      closedBy: ticket.closedBy || "-",
      closedAt: ticket.closedAt || "-",
    }));
    io.emit("ticketsUpdated", formattedTickets); // Update an alle Clients
  } catch (error) {
    console.error("Error sending ticket updates:", error);
  }
}

async function connectToMongo() {
  try {
    const client = await MongoClient.connect(mongoUrl);
    db = client.db(dbName);
    console.log("Connected to MongoDB");
    sendTicketUpdates(); // Initialen Ticket-Update nach Verbindungsaufbau
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1); // Beende den Prozess bei einem kritischen Fehler
  }
}
connectToMongo();

// --- Discord-Bot-Initialisierung (für Chat-History) ---
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessages,
  ],
  partials: [
    Partials.Channel,
    Partials.Message,
    Partials.User,
    Partials.GuildMember,
  ],
});

client.once("ready", () => {
  console.log(`Discord-Bot eingeloggt als ${client.user.tag}!`);
});

client.login(process.env.DISCORD_TOKEN);

// --- Middleware ---
// CORS (nur für Produktion)
app.use(
  cors({
    origin: "https://tickets.wonder-craft.de",
    credentials: true,
  })
);

// Express Session (nur für Produktion)
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: true, // HTTPS erforderlich
      sameSite: "none", // Erforderlich für CORS
      httpOnly: true,
    },
  })
);
app.use(express.json()); // JSON Body Parser

process.chdir("/app"); // Setze das Working Directory auf /app

app.use("/tickets", express.static("tickets"));

app.get("/tickets/:threadID", (req, res) => {
  const { threadID } = req.params;
  if (!threadID || !/^[a-f0-9]{24}$/.test(threadID)) {
    return res.status(400).send("Ungültige Thread-ID.");
  }
  res.sendFile(path.join(__dirname, "tickets", threadID + ".html"));
});

// --- Routen ---

// Login (Discord OAuth2)
app.get("/login", (req, res) => {
  const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${
    process.env.DISCORD_CLIENT_ID
  }&redirect_uri=${encodeURIComponent(
    process.env.DISCORD_REDIRECT_URI
  )}&response_type=code&scope=identify+guilds`;
  res.redirect(discordAuthUrl);
});

// Callback (Discord OAuth2)
app.get("/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) {
    return res.status(400).send("Kein Autorisierungscode erhalten.");
  }

  try {
    // 1. Token austauschen
    const tokenResponse = await axios.post(
      "https://discord.com/api/oauth2/token",
      new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID,
        client_secret: process.env.DISCORD_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: process.env.DISCORD_REDIRECT_URI,
        scope: "identify+guilds",
      }).toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const accessToken = tokenResponse.data.access_token;

    // 2. Benutzerinformationen abrufen
    const userResponse = await axios.get("https://discord.com/api/users/@me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const discordUser = userResponse.data;

    // 3. Benutzer in Session speichern
    req.session.userId = discordUser.id;
    req.session.username = discordUser.username;

    // Korrekter Avatar-Link (nur einmal die Basis-URL)
    req.session.avatar = `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`;

    // 4. Weiterleiten mit Benutzerdaten als Query-Parameter
    res.redirect(
      `https://tickets.wonder-craft.de/dashboard?username=${discordUser.username}&userId=${discordUser.id}&avatar=${discordUser.avatar}`
    );
  } catch (error) {
    console.error("Fehler beim Discord OAuth2 Callback:", error);
    const errorMessage = error.response
      ? `Discord API Fehler: ${error.response.status} - ${JSON.stringify(
          error.response.data
        )}`
      : "Keine Antwort von Discord API erhalten.";
    res.status(500).send(errorMessage);
  }
});

// Authentifizierungsstatus prüfen
app.get("/api/auth/status", (req, res) => {
  if (req.session.userId) {
    res.json({
      isLoggedIn: true,
      userId: req.session.userId,
      username: req.session.username,
      avatar: req.session.avatar,
    });
  } else {
    res.status(200).json({ isLoggedIn: false });
  }
});

// Rolle prüfen
app.get("/check-role/:userId", async (req, res) => {
  const { userId } = req.params;
  if (!userId || !/^\d+$/.test(userId)) {
    return res.status(400).json({ error: "Ungültige Benutzer-ID." });
  }
  console.log(`Check-role aufgerufen für userID: ${userId}`);
  try {
    const guild = await client.guilds.fetch(process.env.GUILD_ID);
    if (!guild) {
      return res.status(404).json({ error: "Server (Guild) nicht gefunden." });
    }
    const member = await guild.members.fetch(userId);
    if (!member) {
      return res
        .status(404)
        .json({ error: "Benutzer nicht auf dem Server gefunden." });
    }
    const hasRole = member.roles.cache.some(
      (role) => role.name === process.env.REQUIRED_ROLE
    );
    const status = member.presence?.status || "offline";
    res.json({ hasRole, status });
  } catch (error) {
    console.error("Fehler beim Überprüfen der Rolle:", error);
    if (error.code === 10013) {
      return res
        .status(404)
        .json({ error: "Benutzer nicht auf dem Server gefunden." });
    } else if (error.code === 10004) {
      return res.status(404).json({ error: "Server (Guild) nicht gefunden." });
    } else {
      return res
        .status(500)
        .json({ error: "Fehler beim Abrufen der Benutzerinformationen." });
    }
  }
});

// Tickets abrufen
app.get("/api/tickets", async (req, res) => {
  try {
    const tickets = await db
      .collection("TicketSystem")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    const formattedTickets = tickets.map((ticket) => ({
      title: ticket.category ? `${ticket.category} Ticket` : "Ticket",
      date: ticket.createdAt,
      threadID: ticket.threadID,
      creator: ticket.creator,
      creatorID: ticket.creatorID,
      category: ticket.category,
      status: ticket.status ? "Offen" : "Geschlossen",
      closedBy: ticket.closedBy || "-",
      closedAt: ticket.closedAt || "-",
    }));
    io.emit("ticketsUpdated", formattedTickets);

    res.json(formattedTickets);
  } catch (error) {
    console.error("Fehler beim Abrufen der Tickets:", error);
    res.status(500).json({ error: "Fehler beim Abrufen der Tickets." });
  }
});

// --- WebSocket-Verbindung ---
io.on("connection", (socket) => {
  console.log("Client verbunden");

  // Event: Ein Client trennt die Verbindung
  socket.on("disconnect", () => {
    console.log("Client getrennt");
  });
});

// Server starten
server.listen(port, () => {
  console.log(`Backend läuft auf Port ${port}`);
});
