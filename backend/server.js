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
    origin: "https://tickets.wonder-craft.de", // Erlaube nur dein Frontend
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// --- MongoDB-Verbindung ---
const mongoUrl = process.env.MONGO_URL;
const dbName = "levelsystem"; // Deine Datenbank
let db;

async function connectToMongo() {
  try {
    const client = await MongoClient.connect(mongoUrl);
    db = client.db(dbName);
    console.log("Connected to MongoDB");
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
      sameSite: isProduction ? "none" : "lax", // "lax" für lokale Entwicklung
      httpOnly: true,
    },
  })
);
app.use(express.json());

// --- Routen ---

// Login (Discord OAuth2)
app.get("/login", (req, res) => {
  const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${
    process.env.DISCORD_CLIENT_ID
  }&redirect_uri=${encodeURIComponent(
    process.env.DISCORD_REDIRECT_URI // Nutze die Umgebungsvariable
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
        redirect_uri: process.env.DISCORD_REDIRECT_URI, // MUSS exakt mit Discord Developer Portal übereinstimmen!
        scope: "identify guilds",
      }).toString(), // Wichtig: .toString()
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

    // 3. Benutzer in Session speichern (WICHTIG für die Authentifizierung!)
    req.session.userId = discordUser.id;
    req.session.username = discordUser.username;
    req.session.avatar = `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`;

    // 4. URL für Weiterleitung erstellen und Query-Parameter anhängen
    const avatarUrl = discordUser.avatar
      ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
      : null; // Fallback, falls kein Avatar

    const redirectUrl = new URL("https://tickets.wonder-craft.de/dashboard"); // Basis-URL des Dashboards
    redirectUrl.searchParams.append("userId", discordUser.id); // User-ID
    redirectUrl.searchParams.append("username", discordUser.username); // Benutzername
    if (avatarUrl) {
      redirectUrl.searchParams.append("avatar", avatarUrl); // Avatar-URL (nur wenn vorhanden)
    }

    // 5. Weiterleiten
    res.redirect(redirectUrl.toString()); // WICHTIG: .toString()!
  } catch (error) {
    console.error("Fehler beim Discord OAuth2 Callback:", error);
    let errorMessage = "Ein unbekannter Fehler ist aufgetreten.";

    if (error.response) {
      // Discord API Fehler (detailliertere Fehlermeldung)
      errorMessage = `Discord API Fehler: ${error.response.status} - ${
        error.response.data ? JSON.stringify(error.response.data) : ""
      }`;
    } else if (error.request) {
      // Anfrage wurde gesendet, aber keine Antwort erhalten
      errorMessage = "Keine Antwort von Discord API erhalten.";
    }
    // ... (andere Fehlerfälle, z.B. Netzwerkfehler) ...

    res.status(500).send(errorMessage); // Sende Fehler an den Client
  }
});

// --- Authentifizierungsstatus prüfen ---
app.get("/api/auth/status", (req, res) => {
  if (req.session.userId) {
    // Benutzer ist eingeloggt
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
  console.log("Check-role aufgerufen für userID: " + userId);
  console.log("GUILD_ID:", process.env.GUILD_ID);
  console.log("REQUIRED_ROLE:", process.env.REQUIRED_ROLE);

  try {
    const guild = await client.guilds.fetch(process.env.GUILD_ID);
    console.log("Guild gefunden:", guild.name);
    const member = await guild.members.fetch(userId);
    console.log("Member gefunden:", member.user.tag);

    const hasRole = member.roles.cache.some((role) => {
      console.log("Prüfe Rolle:", role.name);
      return role.name === process.env.REQUIRED_ROLE;
    });

    console.log("hasRole:", hasRole);

    const status = member.presence?.status || "offline";
    res.json({ hasRole, status });
  } catch (error) {
    console.error("Fehler beim Überprüfen der Rolle:", error);
    if (error.code === 10013) {
      // "Unknown User"
      res
        .status(404)
        .json({ error: "Benutzer nicht auf dem Server gefunden." });
    } else if (error.code === 10004) {
      // "Unknown Guild"
      res.status(404).json({ error: "Server (Guild) nicht gefunden." });
    } else {
      res
        .status(500)
        .json({ error: "Fehler beim Abrufen der Benutzerinformationen." });
    }
  }
});
// Tickets abrufen
app.get("/tickets", async (req, res) => {
  console.log("Tickets werden abgerufen");
  try {
    const tickets = await db.collection("tickets").find({}).toArray();
    const formattedTickets = tickets.map((ticket) => ({
      fileName: ticket._id.toString(),
      title: ticket.category ? `${ticket.category} Ticket` : "Ticket",
      date: ticket.closedAt || new Date().toISOString(),
      threadID: ticket.threadID,
      creator: ticket.creator,
      category: ticket.category,
      status: ticket.status ? "Geschlossen" : "Offen",
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
    const ticket = await db.collection("tickets").findOne({ _id: objectId });
    if (!ticket) {
      return res.status(404).json({ error: "Ticket nicht gefunden." });
    }
    res.json({ channelId: ticket.threadID });
  } catch (error) {
    console.error("Fehler beim Abrufen der Channel-ID:", error);
    res.status(500).json({ error: "Serverfehler." });
  }
});

// Neue Tickets vom Java-Bot empfangen
app.post("/api/tickets/new", async (req, res) => {
  try {
    const ticketData = req.body;
    console.log("Neues Ticket empfangen:", ticketData);

    // Validiere ticketData
    if (
      !ticketData ||
      !ticketData.threadID ||
      !ticketData.creator ||
      !ticketData.category
    ) {
      console.error("Ungültige Ticketdaten:", ticketData);
      return res.status(400).json({ error: "Ungültige Ticketdaten." });
    }

    // Daten in MongoDB speichern
    const result = await db.collection("tickets").insertOne({
      threadID: ticketData.threadID,
      creator: ticketData.creator,
      category: ticketData.category,
      status: 0, // 0 für offen, 1 für geschlossen.  Direkt im Code, da vom Java-Bot nicht gesendet.
      createdAt: new Date(), // Optional: Zeitstempel hinzufügen
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
    // 1. Ticket und Channel-ID aus MongoDB holen
    const objectId = new ObjectId(ticketId);
    const ticket = await db.collection("tickets").findOne({ _id: objectId });

    if (!ticket || !ticket.threadID) {
      return res.status(404).json({ error: "Ticket or Channel ID not found" });
    }
    const channelId = ticket.threadID;

    // 2. Discord Channel holen
    const channel = await client.channels.fetch(channelId);
    if (!channel || channel.type !== 0) {
      // 0 = TextChannel, 11=PublicThread
      return res.status(404).json({
        error: "Discord channel not found or not a text channel/thread.",
      });
    }

    // 3. Nachrichten abrufen
    const messages = await channel.messages.fetch({ limit: 100 }); // Letzte 100 Nachrichten

    // 4. Nachrichten formatieren
    const formattedMessages = Array.from(messages.values())
      .reverse() // Älteste zuerst
      .map((msg) => ({
        author: msg.author.username,
        content: msg.content,
        timestamp: msg.createdTimestamp,
        avatar: msg.author.displayAvatarURL(), // Avatar-URL
        userId: msg.author.id,
      }));

    res.json(formattedMessages); // Chatverlauf senden
  } catch (error) {
    console.error("Error fetching chat history:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Hilfsfunktion: Ticket-Updates senden
async function sendTicketUpdates() {
  try {
    const tickets = await db.collection("tickets").find({}).toArray();
    const formattedTickets = tickets.map((ticket) => ({
      fileName: ticket._id.toString(),
      title: ticket.category ? `${ticket.category} Ticket` : "Ticket",
      date: ticket.closedAt || new Date().toISOString(),
      threadID: ticket.threadID,
      creator: ticket.creator,
      category: ticket.category,
      status: ticket.status ? "Geschlossen" : "Offen",
      closedBy: ticket.closedBy || "-",
      closedAt: ticket.closedAt || "-",
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
      delete userAvatars[userId]; // Avatar entfernen
      io.to(ticketId).emit(
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
        ticketViewers[ticketId] = ticketViewers[ticketId].filter(
          (id) => id !== socket.id
        );
        io.emit(
          "updateTicketViewers",
          ticketId,
          ticketViewers[ticketId],
          userAvatars
        );
      }
    }
    delete userAvatars[socket.id]; // Avatar entfernen
  });

  // Sende die initiale Ticketliste beim Verbinden
  sendTicketUpdates();
});

// Server starten
server.listen(port, () => {
  console.log(`Backend läuft auf Port ${port}`);
});
