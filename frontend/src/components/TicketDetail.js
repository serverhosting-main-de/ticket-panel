import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

function TicketDetail() {
  const { ticketId } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `https://backendtickets.wonder-craft.de/api/tickets/${ticketId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setTicket(response.data);
      } catch (error) {
        console.error("Fehler beim Abrufen des Tickets:", error);
        setError("Fehler beim Laden des Tickets.");
      } finally {
        setLoading(false);
      }
    };

    fetchTicket();
  }, [ticketId]);

  if (loading) {
    return <div>Lade Ticket...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div>
      <h1>Ticket Details</h1>
      <div dangerouslySetInnerHTML={{ __html: ticket.htmlContent }} />
    </div>
  );
}

export default TicketDetail;
