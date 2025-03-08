import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import styled from "styled-components";
import axios from "axios";

// Styled Components für das Design
const DashboardContainer = styled.div`
  padding: 20px;
  font-family: sans-serif;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 20px;
`;

const Avatar = styled.img`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  margin-right: 10px;
`;

const TicketList = styled.ul`
  list-style: none;
  padding: 0;
`;

const TicketItem = styled.li`
  padding: 10px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  &:hover {
    background-color: #f9f9f9;
  }
`;

function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const username = searchParams.get("username");
  const userId = searchParams.get("userId");
  const avatar = searchParams.get("avatar");
  const [tickets, setTickets] = useState([]);
  const [hasRole, setHasRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!username) {
      navigate("/login");
      return;
    }

    localStorage.setItem("username", username);
    localStorage.setItem("loggedIn", "true");
    localStorage.setItem("userId", userId);
    localStorage.setItem("avatar", avatar);

    if (userId) {
      Promise.all([
        axios.get(
          `https://backendtickets.wonder-craft.de/check-role/${userId}`
        ),
        axios.get("https://backendtickets.wonder-craft.de/tickets"),
      ])
        .then(([roleResponse, ticketsResponse]) => {
          setHasRole(roleResponse.data.hasRole);
          let fetchedTickets = ticketsResponse.data;
          if (!roleResponse.data.hasRole && userId) {
            fetchedTickets = fetchedTickets.filter((ticket) =>
              ticket.fileName.includes(userId)
            );
          }
          setTickets(fetchedTickets);
          setLoading(false);
        })
        .catch((error) => {
          console.error("Fehler beim Laden der Daten:", error);
          setError(
            "Fehler beim Laden der Daten. Bitte versuche es später noch einmal."
          );
          setLoading(false);
        });
    }
  }, [username, userId, avatar, navigate]);

  const openTicketChat = (ticketFileName) => {
    window.location.href = `/ticket-chat/${ticketFileName}.html`;
  };

  if (loading) {
    return <DashboardContainer>Lade Daten...</DashboardContainer>;
  }

  if (error) {
    return <DashboardContainer>{error}</DashboardContainer>;
  }

  return (
    <DashboardContainer>
      <UserInfo>
        {avatar && <Avatar src={avatar} alt="Avatar" />}
        <h1>Willkommen im Dashboard, {username}!</h1>
      </UserInfo>

      {hasRole !== null && (
        <p>
          {hasRole
            ? "Du hast Admin/Supporter Rechte."
            : "Du hast Benutzer Rechte."}
        </p>
      )}

      <h2>Deine Tickets</h2>
      {tickets.length > 0 ? (
        <TicketList>
          {tickets.map((ticket) => (
            <TicketItem
              key={ticket.id}
              onClick={() => openTicketChat(ticket.fileName)}
            >
              {ticket.title} ({ticket.date})
            </TicketItem>
          ))}
        </TicketList>
      ) : (
        <p>Keine Tickets gefunden.</p>
      )}
    </DashboardContainer>
  );
}

export default Dashboard;
