import express from "express";
import cors from "cors";
import session from "express-session"; // importiere express-session
import passport from "passport";
import { config } from "./config.js";

// Importiere die Authentifizierungs- und Ticket-Routen
import authRoutes from "./auth.js";
import ticketRoutes from "./tickets.js";

const app = express();

// CORS-Konfiguration (sicherstellen, dass die richtige Origin zugelassen wird)
app.use(
  cors({
    origin: "http://tickets.wonder-craft.de", // Frontend-Origin
    credentials: true, // Mit Cookies
  })
);

// JSON Body-Parser für POST-Anfragen
app.use(express.json());

// Session-Konfiguration (express-session)
app.use(
  session({
    secret: config.session.secret, // Geheimschlüssel aus der Konfiguration
    resave: false, // Sitzungen nicht erneut speichern, wenn sie nicht geändert wurden
    saveUninitialized: false, // Sitzungen nicht speichern, wenn sie nicht initialisiert wurden
    cookie: {
      httpOnly: true, // Sicherheitseinstellung für Cookies
      secure: process.env.NODE_ENV === "production", // Nur in der Produktion sichere Cookies verwenden (HTTPS)
      maxAge: 24 * 60 * 60 * 1000, // 24 Stunden Lebensdauer für die Session
    },
  })
);

// Passport-Initialisierung
app.use(passport.initialize());
app.use(passport.session());

// Authentifizierungs-Routen
app.use("/auth", authRoutes);

// Ticket-Routen
app.use("/tickets", ticketRoutes);

// Fehlerbehandlung (falls Fehler bei den Routen auftreten)
app.use((err, req, res, next) => {
  console.error("Serverfehler:", err.stack);
  res
    .status(500)
    .json({ error: "Etwas ist schiefgelaufen!", message: err.message });
});

// Server starten
app.listen(config.server.port, () => {
  console.log(`Backend läuft auf http://localhost:${config.server.port}`);
});
