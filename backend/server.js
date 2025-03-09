require("dotenv").config();
const express = require("express");
const axios = require("axios");
const session = require("express-session");
const cors = require("cors");
const { Client, GatewayIntentBits, Partials } = require("discord.js");
const http = require("http");
const { Server } = require("socket.io");
const { MongoClient, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 3000;

// --- HTTP Server & Socket.IO ---
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "https://tickets.wonder-craft.de", // Erlaube nur dein Frontend, * in prod
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// --- MongoDB-Verbindung ---
const mongoUrl = process.env.MONGO_URL;
const dbName = "Serverhosting"; // Deine Datenbank
let db;

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
// CORS (angepasst für Entwicklung und Produktion)
const isProduction = process.env.NODE_ENV === "production";
app.use(
  cors({
    origin: isProduction
      ? "https://tickets.wonder-craft.de"
      : "http://localhost:3001", // Erlaube dein lokales Frontend (Entwicklung)
    credentials: true,
  })
);

// Express Session (angepasst für Entwicklung und Produktion)
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: isProduction, // true in Produktion (HTTPS), false in lokaler Entwicklung
      sameSite: isProduction ? "none" : "lax", // "lax" für lokale Entwicklung, "none" für Produktion
      httpOnly: true,
    },
  })
);
app.use(express.json()); // JSON Body Parser

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
        scope: "identify guilds",
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
    req.session.avatar = `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`;

    // 4. Weiterleiten (ohne Query-Parameter)
    res.redirect("https://tickets.wonder-craft.de/dashboard");
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

// --- Authentifizierungsstatus prüfen ---
app.get("/api/auth/status", (req, res) => {
  if (req.session.userId) {
    res.json({
      isLoggedIn: true,
      userId: req.session.userId,
      username: req.session.username,
      avatar: req.session.avatar,
    });
  } else {
    res.status(401).json({ isLoggedIn: false });
  }
});

// Rolle prüfen (Discord-Bot)
app.get("/check-role/:userId", async (req, res) => {
  const { userId } = req.params;
  console.log(`Check-role aufgerufen für userID: ${userId}`); // Verwende Template-Strings
  try {
    const guild = await client.guilds.fetch(process.env.GUILD_ID);
    const member = await guild.members.fetch(userId);
    const hasRole = member.roles.cache.some(
      (role) => role.name === process.env.REQUIRED_ROLE
    );
    hasRole = true; // Testzwecke
    const status = member.presence?.status || "offline";
    res.json({ hasRole, status });
  } catch (error) {
    console.error("Fehler beim Überprüfen der Rolle:", error);
    const statusCode = error.code === 10013 || error.code === 10004 ? 404 : 500; //Konditioneller (ternärer) Operator
    const errorMessage =
      error.code === 10013
        ? "Benutzer nicht auf dem Server gefunden."
        : error.code === 10004
        ? "Server (Guild) nicht gefunden."
        : "Fehler beim Abrufen der Benutzerinformationen.";
    res.status(statusCode).json({ error: errorMessage });
  }
});

// Tickets abrufen
app.get("/tickets", async (req, res) => {
  console.log("Tickets werden abgerufen");
  try {
    const tickets = await db
      .collection("TicketSystem")
      .find({})
      .sort({ createdAt: -1 }) // Neueste zuerst
      .toArray();

    const formattedTickets = tickets.map((ticket) => ({
      fileName: ticket._id.toString(),
      title: ticket.category ? `${ticket.category} Ticket` : "Ticket", //Titel
      date: ticket.createdAt, //createdAt
      threadID: ticket.threadID,
      creator: ticket.creator,
      category: ticket.category,
      status: ticket.status ? "Geschlossen" : "Offen", // Status string
      closedBy: ticket.closedBy || "-",
      closedAt: ticket.closedAt || "-",
    }));
    res.json(formattedTickets);
  } catch (error) {
    console.error("Fehler beim Abrufen der Tickets:", error);
    res.status(500).json({ error: "Serverfehler." });
  }
});

// Channel-ID abrufen
app.get("/api/tickets/:ticketId/channel", async (req, res) => {
  const { ticketId } = req.params;
  try {
    const objectId = new ObjectId(ticketId);
    const ticket = await db
      .collection("TicketSystem")
      .findOne({ _id: objectId });
    if (!ticket) {
      return res.status(404).json({ error: "Ticket nicht gefunden." });
    }
    res.json({ channelId: ticket.threadID });
  } catch (error) {
    console.error("Fehler beim Abrufen der Channel-ID:", error);
    res.status(500).json({ error: "Serverfehler." });
  }
});

// Neue Tickets vom Java-Bot empfangen (POST)
app.post("/api/tickets/new", async (req, res) => {
  try {
    const { threadID, creator, category } = req.body; // Dekonstruiere direkt

    // Validierung
    if (!threadID || !creator || !category) {
      return res.status(400).json({ error: "Ungültige Ticketdaten." });
    }

    // Daten in MongoDB speichern
    const result = await db.collection("TicketSystem").insertOne({
      threadID,
      creator,
      category,
      status: false, // false = offen
      createdAt: new Date(), // Zeitstempel
    });

    console.log("Ticket in Datenbank gespeichert:", result.insertedId);
    sendTicketUpdates(); // Socket.IO Update
    res.status(201).json({ message: "Ticket erfolgreich gespeichert." });
  } catch (error) {
    console.error("Fehler beim Speichern des Tickets:", error);
    res.status(500).json({ error: "Fehler beim Speichern des Tickets." });
  }
});

// Chatverlauf abrufen (über Discord.js)
app.get("/api/tickets/:ticketId/chat", async (req, res) => {
  const { ticketId } = req.params;

  try {
    const objectId = new ObjectId(ticketId);
    const ticket = await db
      .collection("TicketSystem")
      .findOne({ _id: objectId });

    if (!ticket || !ticket.threadID) {
      return res.status(404).json({ error: "Ticket or Channel ID not found" });
    }
    const channelId = ticket.threadID;

    const channel = await client.channels.fetch(channelId);
    if (!channel || channel.type !== 0) {
      return res
        .status(404)
        .json({ error: "Discord channel not found or not a text channel." });
    }

    const messages = await channel.messages.fetch({ limit: 100 }); // Letzte 100 Nachrichten

    const formattedMessages = Array.from(messages.values())
      .reverse()
      .map((msg) => ({
        author: msg.author.username,
        content: msg.content,
        timestamp: msg.createdTimestamp,
        avatar: msg.author.displayAvatarURL(),
        userId: msg.author.id,
      }));

    res.json(formattedMessages);
  } catch (error) {
    console.error("Error fetching chat history:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Hilfsfunktion: Ticket-Updates senden
async function sendTicketUpdates() {
  try {
    const tickets = await db
      .collection("TicketSystem")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    const formattedTickets = tickets.map((ticket) => ({
      fileName: ticket._id.toString(),
      title: ticket.category ? `${ticket.category} Ticket` : "Ticket", //Vereinfachung
      date: ticket.createdAt, //createdAt anzeigen
      threadID: ticket.threadID,
      creator: ticket.creator,
      category: ticket.category,
      status: ticket.status ? "Geschlossen" : "Offen", // Status string
      closedBy: ticket.closedBy || "-", //Wenn closedBy = null, dann "-"
      closedAt: ticket.closedAt || "-", //Wenn closedAt = null, dann "-"
    }));
    io.emit("ticketsUpdated", formattedTickets); // Update an alle Clients
  } catch (error) {
    console.error("Error sending ticket updates:", error);
  }
}

// --- WebSocket-Verbindung (für Ticket-Updates *und* Viewer-Anzeige) ---
const ticketViewers = {}; // Verfolge, wer welches Ticket ansieht
const userAvatars = {}; // Speichere Avatar-Hashes

io.on("connection", (socket) => {
  console.log("Client verbunden");

  socket.on("ticketOpened", (ticketId, userId, avatarHash) => {
    socket.join(ticketId); // Dem Raum für dieses Ticket beitreten
    if (!ticketViewers[ticketId]) {
      ticketViewers[ticketId] = [];
    }
    if (!ticketViewers[ticketId].includes(userId)) {
      ticketViewers[ticketId].push(userId);
      userAvatars[userId] = avatarHash; // Avatar-Hash speichern
    }
    io.to(ticketId).emit(
      //io.to
      "updateTicketViewers",
      ticketId,
      ticketViewers[ticketId],
      userAvatars
    );
  });

  socket.on("ticketClosed", (ticketId, userId) => {
    socket.leave(ticketId); // Den Raum für dieses Ticket verlassen
    if (ticketViewers[ticketId]) {
      ticketViewers[ticketId] = ticketViewers[ticketId].filter(
        (id) => id !== userId
      );
      delete userAvatars[userId];
      io.to(ticketId).emit(
        //io.to
        "updateTicketViewers",
        ticketId,
        ticketViewers[ticketId],
        userAvatars
      );
    }
  });

  socket.on("disconnect", () => {
    console.log("Client getrennt");
    // Aufräumen: Benutzer aus allen Tickets entfernen, die er ansieht
    for (const ticketId in ticketViewers) {
      if (ticketViewers[ticketId].includes(socket.id)) {
        //socket.id anstatt userId
        ticketViewers[ticketId] = ticketViewers[ticketId].filter(
          (id) => id !== socket.id
        ); //socket.id
        io.emit(
          "updateTicketViewers",
          ticketId,
          ticketViewers[ticketId],
          userAvatars
        ); //io.emit
      }
    }
    delete userAvatars[socket.id]; //korrigiert
  });
  // KEIN initialer Ticket-Update hier.  Das passiert jetzt in connectToMongo.
});

// Server starten
server.listen(port, () => {
  console.log(`Backend läuft auf Port ${port}`);
});
