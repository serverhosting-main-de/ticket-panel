import express from "express";
import cors from "cors";
import session from "express-session";
import passport from "passport";
import jwt from "jsonwebtoken";
import { config } from "./config.js";
import authRoutes from "./auth.js";
import ticketRoutes from "./tickets.js";
import { fileURLToPath } from "url";
import { dirname } from "path";
import helmet from "helmet";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: "http://tickets.wonder-craft.de",
    credentials: true,
  })
);

app.use(express.json());

app.use(
  session({
    secret: config.session.secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
      maxAge: 24 * 60 * 60 * 1000,
    },
    proxy: true,
  })
);

app.use(passport.initialize());
app.use(passport.session());

// JWT-Verifizierungs-Middleware
const verifyToken = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ error: "Nicht autorisiert" });
  }
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;
    next();
  } catch (error) {
    return res
      .status(401)
      .json({ error: "Ungültiges Token", message: error.message }); // Fehlerdetails hinzufügen
  }
};

// Routen
app.use("/auth", authRoutes);
app.use("/tickets", verifyToken, ticketRoutes);

// Fehlerbehandlung mit detaillierten Fehlermeldungen
app.use((err, req, res, next) => {
  console.error("Serverfehler:", err); // Fehlerobjekt ausgeben, nicht nur err.stack
  res.status(500).json({
    error: "Interner Serverfehler",
    message: err.message, // Fehlermeldung
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined, // Stack-Trace nur im Entwicklungsmodus
  });
});

const port = config.server.port || 3000;
app.listen(port, () => {
  console.log(`Backend läuft auf http://localhost:${port}`);
});
