import { Router } from "express";
import passport from "passport";
import { Strategy as DiscordStrategy } from "passport-discord";
import { config } from "./config.js";
import session from "express-session";

const router = Router();

// Session-Konfiguration
router.use(
  session({
    secret: config.session.secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Beibehalten von 'false' für HTTP
      sameSite: "Lax",
      maxAge: 24 * 60 * 60 * 1000,
    },
    proxy: process.env.NODE_ENV === "production", // Proxy-Einstellung hinzufügen
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
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log("AccessToken:", accessToken);
        console.log("Profile:", profile);
        return done(null, profile);
      } catch (error) {
        console.error("Fehler bei der Discord-Authentifizierung:", error);
        return done(error, null);
      }
    }
  )
);

// Serialisierung und Deserialisierung des Benutzers
passport.serializeUser((user, done) => {
  done(null, { id: user.id, username: user.username }); // Nur notwendige Daten speichern
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});

// Initialisiere Passport
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
      window.localStorage.setItem("user", JSON.stringify(req.user));
      window.location.href = "http://tickets.wonder-craft.de/dashboard";
      res.end();
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
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

router.get("/error", (req, res) => {
  res.status(500).json({ error: "Authentifizierungsfehler" });
});

// Globale Fehlerbehandlung
router.use((err, req, res, next) => {
  console.error("Serverfehler:", err.stack);
  res
    .status(500)
    .json({ error: "Interner Serverfehler", message: err.message });
});

export default router;
