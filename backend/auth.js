import { Router } from "express";
import passport from "passport";
import { Strategy as DiscordStrategy } from "passport-discord";
import { config } from "./config.js";
import session from "express-session";

const router = Router();

// Session konfigurieren
router.use(
  session({
    secret: "super-secret-key", // Ändere das zu einem geheimen Schlüssel
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax", // Notwendig für CORS und Cookies
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
      console.log("AccessToken:", accessToken);
      console.log("Profile:", profile);
      return done(null, profile);
    }
  )
);

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

// Authentifizierungs-Routen
router.get("/discord", passport.authenticate("discord"));

// Callback-Route nach erfolgreicher Authentifizierung
router.get(
  "/discord/callback",
  passport.authenticate("discord", {
    failureRedirect: "/auth/error", // Weiterleitung bei Fehler
  }),
  (req, res) => {
    req.session.user = req.user; // Benutzer in der Session speichern
    console.log("User authenticated:", req.user);

    // Weiterleitung zur Frontend-URL (z.B. Dashboard)
    res.redirect("http://tickets.wonder-craft.de/dashboard");
  }
);

// Fehlerroute: Zeigt detaillierte Fehlermeldung an
router.get("/error", (req, res) => {
  res.status(500).json({
    error:
      "Es gab einen Fehler bei der Authentifizierung. Bitte versuche es später erneut.",
  });
});

router.get("/user", (req, res) => {
  console.log("User session:", req.session.user); // Ausgabe der Session-Benutzerdaten

  // Prüfen, ob der Benutzer in der Session oder im req.user vorhanden ist
  if (req.user) {
    return res.json(req.user); // Benutzer wurde durch Passport authentifiziert
  } else if (req.session.user) {
    return res.json(req.session.user); // Benutzer in der Session gefunden
  } else {
    return res.status(401).json({ error: "Nicht eingeloggt" }); // Kein Benutzer gefunden
  }
});

// Fehlerbehandlung (Optional, wenn du Fehler protokollieren möchtest)
router.use((err, req, res, next) => {
  console.error("Serverfehler:", err.stack);
  res.status(500).json({
    error: "Etwas ist schiefgelaufen!",
    message: err.message,
  });
});

export default router;
