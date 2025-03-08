import { Router } from "express";
import passport from "passport";
import session from "express-session";
import jwt from "jsonwebtoken";
import { config } from "./config.js";
import configurePassport from "./passportConfig.js";

const router = Router();

// Sichere Session-Konfiguration (wird nur noch für die initiale Discord-Authentifizierung verwendet)
router.use(
  session({
    secret: config.session.secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
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

// JWT-Verifizierungs-Middleware
const verifyToken = (req, res, next) => {
  const token = req.cookies.token; // JWT aus dem Cookie abrufen
  if (!token) {
    return res.status(401).json({ error: "Nicht autorisiert" });
  }
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Ungültiges Token" });
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
      const token = jwt.sign(payload, config.jwtSecret, { expiresIn: "1h" }); // JWT erstellen
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
      }); // JWT als Cookie senden
      res.redirect("http://tickets.wonder-craft.de/dashboard");
    } catch (error) {
      console.error(
        "Fehler bei der Weiterleitung nach der Authentifizierung:",
        error
      );
      res.redirect("/auth/error");
    }
  }
);

router.get("/user", verifyToken, (req, res) => {
  try {
    return res.json(req.user); // Benutzerdaten aus dem verifizierten Token senden
  } catch (error) {
    console.error("Fehler beim Abrufen der Benutzerdaten:", error);
    res
      .status(500)
      .json({ error: "Interner Serverfehler", message: error.message });
  }
});

router.get("/error", (req, res) => {
  res.status(500).json({
    error: "Authentifizierungsfehler",
    message: "Fehler bei der Authentifizierung",
  });
});

// Globale Fehlerbehandlung
router.use((err, req, res, next) => {
  console.error("Serverfehler:", err.stack);
  res.status(500).json({
    error: "Interner Serverfehler",
    message: err.message,
    stack: err.stack,
  });
});

export default router;
