import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import styled from "styled-components";

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

  useEffect(() => {
    if (!username) {
      navigate("/login");
      return;
    }

    // Daten im localStorage speichern
    localStorage.setItem("username", username);
    localStorage.setItem("loggedIn", "true");
    localStorage.setItem("userId", userId);
    localStorage.setItem("avatar", avatar);

    const exampleTickets = [
      { id: 1, title: "Problem mit Login", date: "2023-10-26" },
      { id: 2, title: "Frage zu Account-Einstellungen", date: "2023-10-25" },
    ];
    setTickets(exampleTickets);
  }, [username, userId, avatar, navigate]);

  // Funktion zum Öffnen des Ticket-Chatverlaufs
  const openTicketChat = (ticketId) => {
    // Hier sollte die Weiterleitung zu deinem HTML-Chatverlauf erfolgen
    window.location.href = `/ticket-chat/${ticketId}.html`;
  };

  return (
    <DashboardContainer>
      <UserInfo>
        {avatar && <Avatar src={avatar} alt="Avatar" />}
        <h1>Willkommen im Dashboard, {username}!</h1>
      </UserInfo>

      <h2>Deine Tickets</h2>
      <TicketList>
        {tickets.map((ticket) => (
          <TicketItem key={ticket.id} onClick={() => openTicketChat(ticket.id)}>
            {ticket.title} ({ticket.date})
          </TicketItem>
        ))}
      </TicketList>
    </DashboardContainer>
  );
}

export default Dashboard;
