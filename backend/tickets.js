// tickets.js
import { Router } from "express";
import fs from "fs";
import path from "path";

// Router für Ticket-Routen
const router = Router();

// Ticket-Ordner
const ticketFolder = path.join(process.cwd(), "tickets/");

// Basis-URL für den Zugriff auf Tickets (aus Umgebungsvariable)
const baseUrl = process.env.BASE_URL || "http://backendtickets.wonder-craft.de";

// Routen für Tickets
router.get("/", (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Nicht eingeloggt" });

  // Lese den Ticket-Ordner und filtere nach Benutzer-Tickets
  fs.readdir(ticketFolder, (err, files) => {
    if (err)
      return res.status(500).json({ error: "Fehler beim Lesen der Tickets" });

    // Filtere Tickets basierend auf der Benutzer-ID
    const userTickets = files.filter(
      (file) => file.includes(`transcript-${req.user.id}.html`) // Tickets für den eingeloggten Benutzer
    );

    // Sende Tickets mit URL zurück
    res.json(
      userTickets.map((name) => ({
        name,
        url: `${baseUrl}/tickets/${name}`, // URL basiert auf der Umgebungsvariablen
      }))
    );
  });
});

// Ticket-Datei-Route (optional: Zugriff auf Ticket-Dateien ermöglichen)
router.get("/:ticketName", (req, res) => {
  const ticketPath = path.join(ticketFolder, req.params.ticketName);

  // Lese die Ticket-Datei
  fs.readFile(ticketPath, "utf8", (err, data) => {
    if (err) {
      if (err.code === "ENOENT") {
        return res.status(404).json({ error: "Ticket nicht gefunden" });
      }
      return res.status(500).json({ error: "Fehler beim Laden des Tickets" });
    }

    res.setHeader("Content-Type", "text/html");
    res.send(data);
  });
});

export default router;
