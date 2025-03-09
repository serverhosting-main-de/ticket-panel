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
    origin: "https://tickets.wonder-craft.de",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// --- MongoDB-Verbindung ---
const mongoUrl = process.env.MONGO_URL;
const dbName = "levelsystem";
let db;

async function connectToMongo() {
  try {
    const client = await MongoClient.connect(mongoUrl);
    db = client.db(dbName);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1);
  }
}
connectToMongo();

// --- Discord-Bot-Initialisierung (jetzt für Chat-History) ---
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.MessageContent, // Benötigt für Nachrichten
    GatewayIntentBits.GuildMessages, // Benötigt für Nachrichten
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
app.use(cors({ origin: "https://tickets.wonder-craft.de", credentials: true }));
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true, sameSite: "none", httpOnly: true },
  })
);
app.use(express.json());

// --- Routen ---

// Login, Callback (wie zuvor, ohne Speichern des Access-Tokens)
app.get("/login", (req, res) => {
  /* ... (dein bestehender Code) ... */
});
app.get("/callback", async (req, res) => {
  /* ... (dein bestehender Code) ... */
});

// KEIN /api/discord-token mehr!

// Rolle prüfen
app.get("/check-role/:userId", async (req, res) => {
  /* ... (dein bestehender Code) ... */
});

// Tickets abrufen
app.get("/tickets", async (req, res) => {
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

// Channel-ID abrufen (wie gehabt)
app.get("/api/tickets/:ticketId/channel", async (req, res) => {
  /* ... (dein bestehender Code) ... */
});

// Neue Tickets vom Java-Bot empfangen (wie gehabt)
app.post("/api/tickets/new", async (req, res) => {
  /* ... (dein bestehender Code) ... */
});

// --- NEU: Chatverlauf abrufen (über Discord.js) ---
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
      return res
        .status(404)
        .json({
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

// Hilfsfunktion: Ticket-Updates senden (wie gehabt)
async function sendTicketUpdates() {
  try {
    const tickets = await db.collection("tickets").find({}).toArray();
    const formattedTickets = tickets.map((ticket) => ({
      fileName: ticket._id.toString(),
      title: ticket.category ? `${ticket.category} Ticket` : "Ticket",
      date: ticket.closedAt || new Date().toISOString(),
      threadID: ticket.threadID,
      creator: ticket.creator, // NEU: Creator
      category: ticket.category, // NEU: Kategorie
      status: ticket.status ? "Geschlossen" : "Offen", // NEU: Status (als Text)
      closedBy: ticket.closedBy || "-", // NEU: Geschlossen von (oder '-')
      closedAt: ticket.closedAt || "-", // NEU: Geschlossen am (oder '-')
    }));
    io.emit("ticketsUpdated", formattedTickets); // Update an alle Clients
  } catch (error) {
    console.error("Error sending ticket updates:", error);
  }
}

// --- WebSocket-Verbindung (für Ticket-Updates *und* neue Nachrichten) ---
const ticketViewers = {}; //Keep track of viewers
const userAvatars = {};
io.on("connection", (socket) => {
  console.log("Client verbunden");

  socket.on("ticketOpened", (ticketId, userId, avatarHash) => {
    //JOIN ROOM
    socket.join(ticketId);
    if (!ticketViewers[ticketId]) {
      ticketViewers[ticketId] = []; // Corrected line
    }
    if (!ticketViewers[ticketId].includes(userId)) {
      ticketViewers[ticketId].push(userId);
      userAvatars[userId] = avatarHash; // Avatar-Hash speichern
    }
    io.to(ticketId).emit(
      //BEVOR:  io.emit
      "updateTicketViewers",
      ticketId,
      ticketViewers[ticketId],
      userAvatars
    ); // userAvatars senden
  });

  socket.on("ticketClosed", (ticketId, userId) => {
    socket.leave(ticketId); //LEAVE ROOM

    if (ticketViewers[ticketId]) {
      ticketViewers[ticketId] = ticketViewers[ticketId].filter(
        (id) => id !== userId
      );
      delete userAvatars[userId]; // Remove avatar when user leaves
      io.to(ticketId).emit(
        //BEVOR:  io.emit
        "updateTicketViewers",
        ticketId,
        ticketViewers[ticketId],
        userAvatars
      );
    }
  });

  socket.on("disconnect", () => {
    console.log("Client getrennt");
    // Clean up user from all tickets they might be viewing on disconnect
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
        ); // corrected
      }
    }
    delete userAvatars[socket.id]; // Clean up avatar
  });
  // Send initial ticket list.
  sendTicketUpdates();
});

// Server starten
server.listen(port, () => {
  console.log(`Backend läuft auf Port ${port}`);
});
