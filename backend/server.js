import express from "express";
import cors from "cors";
import session from "express-session";
import passport from "passport";
import { config } from "./config.js";
import authRoutes from "./auth.js";
import ticketRoutes from "./tickets.js";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Beibehalten von 'false' für HTTP
      sameSite: "Lax",
      maxAge: 24 * 60 * 60 * 1000, // 24 Stunden
    },
  })
);

// Passport-Initialisierung
app.use(passport.initialize());
app.use(passport.session());

// Routen
app.use("/auth", authRoutes);
app.use("/tickets", ticketRoutes);

// Fehlerbehandlung
app.use((err, req, res, next) => {
  console.error("Serverfehler:", err.stack);
  res
    .status(500)
    .json({ error: "Interner Serverfehler", message: err.message });
});

// Server starten
const port = config.server.port || 3000;
app.listen(port, () => {
  console.log(`Backend läuft auf http://localhost:${port}`);
});
