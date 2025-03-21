require("dotenv").config();
const fs = require("fs");
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const { Client, GatewayIntentBits, Partials } = require("discord.js");
const http = require("http");
const { Server } = require("socket.io");
const { MongoClient } = require("mongodb");
const path = require("path");
const jwt = require("jsonwebtoken");

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(
  cors({
    origin: "https://tickets.wonder-craft.de", // Erlaube nur dein Frontend
    credentials: true, // Cookies zulassen
  })
);
app.use(express.json()); // JSON Body Parser

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
const dbName = "Serverhosting";
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

// --- JWT-Helper-Funktionen ---
function generateToken(user) {
  return jwt.sign(user, process.env.JWT_SECRET, { expiresIn: "1h" });
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

  if (!token) return res.status(401).json({ error: "Nicht autorisiert." });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Ungültiges Token." });
    req.user = user;
    next();
  });
}

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

    // 3. Überprüfen, ob der Benutzer die erforderliche Rolle hat
    let hasRole = false;
    try {
      const guild = await client.guilds.fetch(process.env.GUILD_ID);
      if (guild) {
        const member = await guild.members.fetch(discordUser.id);
        if (member) {
          hasRole = member.roles.cache.some(
            (role) => role.name === process.env.REQUIRED_ROLE
          );
        }
      }
    } catch (error) {
      console.error("Fehler beim Überprüfen der Rolle:", error);
    }

    // 4. JWT erstellen
    const token = generateToken({
      userId: discordUser.id,
      username: discordUser.username,
      avatar: `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`,
      hasRole,
    });

    // 5. Weiterleiten mit JWT als Query-Parameter
    res.redirect(`${process.env.FRONTEND_URL}/login?token=${token}`);
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
app.get("/api/auth/status", authenticateToken, (req, res) => {
  res.json({
    isLoggedIn: true,
    userId: req.user.userId,
    username: req.user.username,
    avatar: req.user.avatar,
    hasRole: req.user.hasRole,
  });
});

// Rolle prüfen
app.get("/check-role/:userId", authenticateToken, async (req, res) => {
  const { userId } = req.params;
  if (!userId || !/^\d+$/.test(userId)) {
    return res.status(400).json({ error: "Ungültige Benutzer-ID." });
  }

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
app.get("/api/tickets", authenticateToken, async (req, res) => {
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
      claimedBy: ticket.claimedBy || "-",
      status: ticket.status,
      closedBy: ticket.closedBy || "-",
      closedAt: ticket.closedAt || "-",
    }));

    // Filtere die Tickets basierend auf der Rolle
    const filteredTickets = req.user.hasRole
      ? formattedTickets
      : formattedTickets.filter(
          (ticket) => ticket.creatorID === req.user.userId
        );

    res.json({ data: filteredTickets });
    io.emit("ticketsUpdated", filteredTickets); // Sende aktualisierte Tickets an alle Clients
  } catch (error) {
    console.error("Fehler beim Abrufen der Tickets:", error);
    res.status(500).json({ error: "Fehler beim Abrufen der Tickets." });
  }
});

app.get("/api/tickets/:ticketId", authenticateToken, async (req, res) => {
  const { ticketId } = req.params;

  try {
    // Überprüfe, ob das Ticket existiert
    const ticket = await db
      .collection("TicketSystem")
      .findOne({ threadID: ticketId });

    if (!ticket) {
      return res.status(404).json({ error: "Ticket nicht gefunden." });
    }

    // Überprüfe Zugriffsberechtigung
    if (!req.user.hasRole && ticket.creatorID !== req.user.userId) {
      return res
        .status(403)
        .json({ error: "Keine Berechtigung für dieses Ticket." });
    }

    // HTML-Datei aus dem /tickets Ordner lesen
    const htmlPath = path.join(__dirname, "tickets", `${ticketId}.html`);

    try {
      const htmlContent = await fs.promises.readFile(htmlPath, "utf8");
      res.json({
        threadID: ticket.threadID,
        category: ticket.category,
        creator: ticket.creator,
        creatorID: ticket.creatorID,
        status: ticket.status,
        date: ticket.createdAt,
        claimedBy: ticket.claimedBy || null,
        closedBy: ticket.closedBy || null,
        closedAt: ticket.closedAt || null,
        htmlContent: htmlContent,
      });
    } catch (fileError) {
      console.error("Fehler beim Lesen der HTML-Datei:", fileError);
      res.status(404).json({ error: "Ticket-Transcript nicht gefunden." });
    }
  } catch (error) {
    console.error("Fehler beim Abrufen des Tickets:", error);
    res.status(500).json({ error: "Fehler beim Laden des Tickets." });
  }
});

// Chat-Nachrichten aus Discord abrufen
// Chat-Nachrichten aus Discord abrufen
app.get("/api/tickets/:ticketId/chat", authenticateToken, async (req, res) => {
  const { ticketId } = req.params;

  try {
    // Überprüfe, ob das Ticket existiert
    const ticket = await db
      .collection("TicketSystem")
      .findOne({ threadID: ticketId });

    if (!ticket) {
      return res.status(404).json({ error: "Ticket nicht gefunden." });
    }

    // Überprüfe Zugriffsberechtigung
    if (!req.user.hasRole && ticket.creatorID !== req.user.userId) {
      return res
        .status(403)
        .json({ error: "Keine Berechtigung für dieses Ticket." });
    }

    try {
      // Discord Channel abrufen
      const guild = await client.guilds.fetch(process.env.GUILD_ID);
      const channel = await guild.channels.fetch(ticketId);

      // Nachrichten aus dem Discord-Channel abrufen
      const messages = await channel.messages.fetch({ limit: 100 });

      // Nachrichten formatieren
      const formattedMessages = messages.reverse().map((msg) => {
        // Basis-Nachrichtenobjekt
        const formattedMessage = {
          sender: msg.author.username,
          text: msg.content,
          timestamp: msg.createdAt,
          avatarURL: msg.author.displayAvatarURL({ format: "png", size: 32 }),
        };

        // Wenn die Nachricht Embeds enthält
        if (msg.embeds && msg.embeds.length > 0) {
          formattedMessage.embeds = msg.embeds.map((embed) => ({
            title: embed.title || null,
            description: embed.description || null,
            url: embed.url || null,
            color: embed.color || null,
            timestamp: embed.timestamp || null,

            // Author-Informationen
            author: embed.author
              ? {
                  name: embed.author.name || null,
                  url: embed.author.url || null,
                  iconURL: embed.author.iconURL || null,
                }
              : null,

            // Thumbnail
            thumbnail: embed.thumbnail
              ? {
                  url: embed.thumbnail.url || null,
                  height: embed.thumbnail.height || null,
                  width: embed.thumbnail.width || null,
                }
              : null,

            // Hauptbild
            image: embed.image
              ? {
                  url: embed.image.url || null,
                  height: embed.image.height || null,
                  width: embed.image.width || null,
                }
              : null,

            // Footer
            footer: embed.footer
              ? {
                  text: embed.footer.text || null,
                  iconURL: embed.footer.iconURL || null,
                }
              : null,

            // Felder
            fields: embed.fields
              ? embed.fields.map((field) => ({
                  name: field.name,
                  value: field.value,
                  inline: field.inline,
                }))
              : [],
          }));
        }

        // Wenn die Nachricht Attachments enthält
        if (msg.attachments.size > 0) {
          formattedMessage.attachments = Array.from(
            msg.attachments.values()
          ).map((attachment) => ({
            url: attachment.url,
            name: attachment.name,
            contentType: attachment.contentType,
            size: attachment.size,
            height: attachment.height,
            width: attachment.width,
          }));
        }

        // Wenn die Nachricht Komponenten (Buttons, etc.) enthält
        if (msg.components && msg.components.length > 0) {
          formattedMessage.components = msg.components;
        }

        // Wenn die Nachricht Reaktionen enthält
        if (msg.reactions.cache.size > 0) {
          formattedMessage.reactions = Array.from(
            msg.reactions.cache.values()
          ).map((reaction) => ({
            emoji: reaction.emoji.name,
            count: reaction.count,
          }));
        }

        return formattedMessage;
      });

      res.json(formattedMessages);
    } catch (discordError) {
      console.error(
        "Fehler beim Abrufen der Discord-Nachrichten:",
        discordError
      );
      res
        .status(500)
        .json({ error: "Fehler beim Laden der Chat-Nachrichten." });
    }
  } catch (error) {
    console.error("Fehler beim Abrufen des Tickets:", error);
    res.status(500).json({ error: "Fehler beim Laden des Tickets." });
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
