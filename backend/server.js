// server.js
import express from "express";
import cors from "cors";
import session from "cookie-session";
import passport from "passport";
import { config } from "./config.js";

// Importiere die Authentifizierungs- und Ticket-Routen
import authRoutes from "./auth.js";
import ticketRoutes from "./tickets.js";

const app = express();

// CORS-Konfiguration (sicherstellen, dass die richtige Origin zugelassen wird)
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || "http://tickets.wonder-craft.de", // Umgebungsvariable für Frontend-Origin
    credentials: true,
  })
);

// Session-Konfiguration
app.use(
  session({
    secret: config.session.secret,
    resave: false,
    saveUninitialized: false,
  })
);

// Passport-Initialisierung
app.use(passport.initialize());
app.use(passport.session());

// Authentifizierungs-Routen
app.use("/auth", authRoutes);

// Ticket-Routen
app.use("/tickets", ticketRoutes);

// Server starten
app.listen(config.server.port, () => {
  console.log(`Backend läuft auf http://localhost:${config.server.port}`);
});
