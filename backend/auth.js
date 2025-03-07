import { Router } from "express";
import passport from "passport";
import { Strategy as DiscordStrategy } from "passport-discord";
import { config } from "./config.js";

const router = Router();

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
      // Protokolliere das erhaltene Profil
      console.log("AccessToken:", accessToken);
      console.log("Profile:", profile);

      // Hier kannst du zusätzliche Logik hinzufügen, wie das Speichern des Profils in einer Datenbank
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
    successRedirect: "http://tickets.wonder-craft.de/dashboard", // Frontend-URL nach erfolgreichem Login
    failureRedirect: "/",
  }),
  (req, res) => {
    // Zusätzliche Logik nach erfolgreicher Authentifizierung
    console.log("User authenticated:", req.user);
  }
);

// Route, um Benutzerinformationen abzurufen (nach der Authentifizierung)
router.get("/user", (req, res) => {
  req.user
    ? res.json(req.user)
    : res.status(401).json({ error: "Nicht eingeloggt" });
});

// Fehlerbehandlung (Optional, wenn du Fehler protokollieren möchtest)
router.use((err, req, res, next) => {
  console.error("Serverfehler:", err.stack); // Fehler in der Konsole anzeigen
  res.status(500).send("Etwas ist schiefgelaufen!");
});

export default router;
