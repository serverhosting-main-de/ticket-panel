import { Router } from "express";
import passport from "passport";
import { Strategy as DiscordStrategy } from "passport-discord";
import { config } from "./config.js";
import session from "express-session";

const router = Router();

// Session-Konfiguration
router.use(
  session({
    secret: config.session.secret || "super-secret-key", // Geheimer Schlüssel aus der Konfiguration
    resave: false, // Session nicht erneut speichern, wenn sie nicht geändert wurde
    saveUninitialized: false, // Keine leeren Sessions speichern
    cookie: {
      httpOnly: true, // Cookie nur über HTTP(S) zugänglich
      secure: false, // Nur in der Produktion sichere Cookies (HTTPS)
      sameSite: "Lax", // Schutz vor CSRF-Angriffen
      maxAge: 24 * 60 * 60 * 1000, // Cookie-Gültigkeit: 24 Stunden
    },
  })
);

// Discord-Strategie für Passport
passport.use(
  new DiscordStrategy(
    {
      clientID: process.env.DISCORD_CLIENT_ID || config.discord.clientID,
      clientSecret:
        process.env.DISCORD_CLIENT_SECRET || config.discord.clientSecret,
      callbackURL:
        process.env.DISCORD_CALLBACK_URL || config.discord.callbackURL,
      scope: config.discord.scope,
    },
    (accessToken, refreshToken, profile, done) => {
      try {
        console.log("AccessToken:", accessToken);
        console.log("Profile:", profile);
        return done(null, profile); // Erfolgreiche Authentifizierung
      } catch (error) {
        console.error("Fehler bei der Discord-Authentifizierung:", error);
        return done(error, null); // Fehler bei der Authentifizierung
      }
    }
  )
);

// Serialisierung und Deserialisierung des Benutzers
passport.serializeUser((user, done) => {
  done(null, user); // Benutzer in der Session speichern
});

passport.deserializeUser((obj, done) => {
  done(null, obj); // Benutzer aus der Session abrufen
});

// Initialisiere Passport
router.use(passport.initialize());
router.use(passport.session());

// Authentifizierungs-Routen

/**
 * Route: Startet den Discord-OAuth2-Login-Prozess.
 */
router.get("/discord", passport.authenticate("discord"));

/**
 * Route: Callback nach erfolgreicher Discord-Authentifizierung.
 */
router.get(
  "/discord/callback",
  passport.authenticate("discord", {
    failureRedirect: "/auth/error", // Weiterleitung bei Fehler
  }),
  (req, res) => {
    try {
      req.session.user = req.user; // Benutzer in der Session speichern
      console.log("User authenticated:", req.user);

      // Weiterleitung zur Frontend-URL (z.B. Dashboard)
      res.redirect("http://tickets.wonder-craft.de/dashboard");
    } catch (error) {
      console.error(
        "Fehler bei der Weiterleitung nach der Authentifizierung:",
        error
      );
      res.redirect("/auth/error"); // Weiterleitung zur Fehlerseite
    }
  }
);

/**
 * Route: Gibt die aktuellen Benutzerdaten zurück.
 */
router.get("/user", (req, res) => {
  try {
    console.log("User session:", req.session.user);

    // Prüfen, ob der Benutzer in der Session oder im req.user vorhanden ist
    if (req.user) {
      return res.json(req.user); // Benutzer wurde durch Passport authentifiziert
    } else if (req.session.user) {
      return res.json(req.session.user); // Benutzer in der Session gefunden
    } else {
      return res.status(401).json({ error: "Nicht eingeloggt" }); // Kein Benutzer gefunden
    }
  } catch (error) {
    console.error("Fehler beim Abrufen der Benutzerdaten:", error);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

/**
 * Route: Fehlerseite für Authentifizierungsfehler.
 */
router.get("/error", (req, res) => {
  res.status(500).json({
    error:
      "Es gab einen Fehler bei der Authentifizierung. Bitte versuche es später erneut.",
  });
});

/**
 * Middleware: Globale Fehlerbehandlung.
 */
router.use((err, req, res, next) => {
  console.error("Serverfehler:", err.stack);
  res.status(500).json({
    error: "Etwas ist schiefgelaufen!",
    message: err.message,
  });
});

export default router;
