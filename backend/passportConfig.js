import passport from "passport";
import { Strategy as DiscordStrategy } from "passport-discord";
import { config } from "./config.js";

export default function configurePassport() {
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

  passport.serializeUser((user, done) => {
    done(null, { id: user.id, username: user.username });
  });

  passport.deserializeUser((obj, done) => {
    done(null, obj);
  });
}
