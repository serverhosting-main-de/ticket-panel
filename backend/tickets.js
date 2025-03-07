// tickets.js
import { Router } from "express";
import fs from "fs";
import path from "path";

const router = Router();
const ticketFolder = path.join(process.cwd(), "tickets/"); // Hier speicherst du die Ticket-Dateien

// Routen für Tickets
router.get("/", (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Nicht eingeloggt" });

  fs.readdir(ticketFolder, (err, files) => {
    if (err)
      return res.status(500).json({ error: "Fehler beim Lesen der Tickets" });

    const userTickets = files.filter(
      (file) => file.includes(`transcript-${req.user.id}.html`) // Tickets für den eingeloggenen Benutzer
    );

    // Tickets mit URL zurückgeben
    res.json(
      userTickets.map((name) => ({
        name,
        url: `http://backendtickets.wonder-craft.de/tickets/${name}`,
      }))
    );
  });
});

// Ticket-Datei-Route (optional: Zugriff auf Ticket-Dateien ermöglichen)
router.get("/:ticketName", (req, res) => {
  const ticketPath = path.join(ticketFolder, req.params.ticketName);

  fs.readFile(ticketPath, "utf8", (err, data) => {
    if (err)
      return res.status(500).json({ error: "Fehler beim Laden des Tickets" });

    res.setHeader("Content-Type", "text/html");
    res.send(data);
  });
});

export default router;
