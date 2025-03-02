// auth.js
import { Router } from "express";
import passport from "passport";
import { Strategy as DiscordStrategy } from "passport-discord";
import { config } from "./config.js";

const router = Router();

// Discord-Strategie für Passport
passport.use(
  new DiscordStrategy(
    {
      clientID: config.discord.clientID,
      clientSecret: config.discord.clientSecret,
      callbackURL: config.discord.callbackURL,
      scope: config.discord.scope,
    },
    (accessToken, refreshToken, profile, done) => {
      // Hier kannst du zusätzliche Logik hinzufügen (z.B. Speicherung des Profils in einer DB)
      return done(null, profile);
    }
  )
);

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

// Authentifizierungs-Routen
router.get("/discord", passport.authenticate("discord"));
router.get(
  "/discord/callback",
  passport.authenticate("discord", {
    successRedirect: "http://tickets.wonder-craft.de:5173/dashboard", // Frontend-URL nach erfolgreichem Login
    failureRedirect: "/",
  })
);

// Route, um Benutzerinformationen abzurufen (nach der Authentifizierung)
router.get("/user", (req, res) => {
  req.user
    ? res.json(req.user)
    : res.status(401).json({ error: "Nicht eingeloggt" });
});

export default router;
