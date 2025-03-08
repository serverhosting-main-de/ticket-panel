import { Router } from "express";
import passport from "passport";
import session from "express-session";
import { config } from "./config.js";
import configurePassport from "./passportConfig.js";

const router = Router();

// Session-Konfiguration
router.use(
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

// Passport-Konfiguration
configurePassport();
router.use(passport.initialize());
router.use(passport.session());

// Authentifizierungs-Routen
router.get("/discord", passport.authenticate("discord"));

router.get(
  "/discord/callback",
  passport.authenticate("discord", {
    failureRedirect: "/auth/error",
  }),
  (req, res) => {
    try {
      req.session.user = req.user;
      console.log("Benutzerdaten:", req.user);
      console.log("Session:", req.session);
      console.log("Weiterleitung nach /dashboard");
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

router.get("/user", (req, res) => {
  try {
    if (req.user) {
      return res.json(req.user);
    } else if (req.session.user) {
      return res.json(req.session.user);
    } else {
      return res.status(401).json({ error: "Nicht eingeloggt" });
    }
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
    stack: err.stack, // Stack immer ausgeben
  });
});

export default router;
