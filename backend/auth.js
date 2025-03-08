import { Router } from "express";
import passport from "passport";
import session from "express-session";
import jwt from "jsonwebtoken";
import { config } from "./config.js";
import configurePassport from "./passportConfig.js";

const router = Router();

// Session-Konfiguration mit secure: false
router.use(
  session({
    secret: config.session.secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Cookies auch über HTTP senden
      sameSite: "Lax",
      maxAge: 24 * 60 * 60 * 1000,
    },
    proxy: true,
  })
);

// Passport-Konfiguration
configurePassport();
router.use(passport.initialize());
router.use(passport.session());

// JWT-Verifizierungs-Middleware mit detaillierten Fehlermeldungen
const verifyToken = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({
      error: "Nicht autorisiert",
      details: "Kein Token gefunden",
    });
  }
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      error: "Ungültiges Token",
      details: error.message,
    });
  }
};

// Authentifizierungs-Routen
router.get("/discord", passport.authenticate("discord"));

router.get(
  "/discord/callback",
  passport.authenticate("discord", {
    failureRedirect: "/auth/error",
  }),
  (req, res) => {
    try {
      const payload = {
        id: req.user.id,
        username: req.user.username,
      };
      const token = jwt.sign(payload, config.jwtSecret, { expiresIn: "1h" });
      res.cookie("token", token, {
        httpOnly: true,
        secure: false, // Cookies auch über HTTP senden
      });
      res.redirect("http://tickets.wonder-craft.de/dashboard");
    } catch (error) {
      console.error(
        "Fehler bei der Weiterleitung nach der Authentifizierung:",
        error.message,
        error.stack
      );
      res.status(500).json({
        error: "Authentifizierungsfehler",
        message: error.message, // Detaillierte Fehlermeldung
        stack: error.stack, // Stacktrace für Debugging
      });
    }
  }
);

router.get("/user", verifyToken, (req, res) => {
  try {
    return res.json(req.user);
  } catch (error) {
    console.error("Fehler beim Abrufen der Benutzerdaten:", error);
    res.status(500).json({
      error: "Interner Serverfehler",
      message: error.message,
      stack: error.stack, // Stacktrace für Debugging
    });
  }
});

router.get("/error", (req, res) => {
  const error = new Error("Fehler bei der Authentifizierung");
  res.status(500).json({
    error: "Authentifizierungsfehler",
    message: error.message, // Detaillierte Fehlermeldung
    stack: error.stack, // Stacktrace für Debugging
  });
});

// Globale Fehlerbehandlung mit detaillierten Fehlermeldungen
router.use((err, req, res, next) => {
  console.error("Serverfehler:", err.stack);
  res.status(500).json({
    error: "Interner Serverfehler",
    message: err.message, // Detaillierte Fehlermeldung
    stack: err.stack, // Stacktrace für Debugging
  });
});

export default router;
