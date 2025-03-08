import { Router } from "express";
import fs from "fs";
import path from "path";
import jwt from "jsonwebtoken";
import { config } from "./config.js";

const router = Router();
const ticketFolder = path.join(process.cwd(), "tickets");
const baseUrl = process.env.BASE_URL || "http://backendtickets.wonder-craft.de";

// Middleware zur JWT-Verifizierung
const verifyToken = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ error: "Nicht autorisiert" });
  }
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded; // Benutzerdaten im Request-Objekt speichern
    next();
  } catch (error) {
    return res.status(401).json({ error: "Ungültiges Token" });
  }
};

router.get("/", verifyToken, (req, res) => {
  fs.readdir(ticketFolder, (err, files) => {
    if (err) {
      console.error("Fehler beim Lesen der Tickets:", err);
      return res.status(500).json({ error: "Fehler beim Lesen der Tickets" });
    }

    const userTickets = files.filter((file) =>
      file.includes(`transcript-${req.user.id}.html`)
    );

    res.json(
      userTickets.map((name) => ({
        name,
        url: `${baseUrl}/tickets/${name}`,
      }))
    );
  });
});

router.get("/:ticketName", (req, res) => {
  const ticketPath = path.join(ticketFolder, req.params.ticketName);

  fs.readFile(ticketPath, "utf8", (err, data) => {
    if (err) {
      if (err.code === "ENOENT") {
        return res.status(404).json({ error: "Ticket nicht gefunden" });
      }
      console.error("Fehler beim Laden des Tickets:", err);
      return res.status(500).json({ error: "Fehler beim Laden des Tickets" });
    }

    res.setHeader("Content-Type", "text/html");
    res.send(data);
  });
});

export default router;
