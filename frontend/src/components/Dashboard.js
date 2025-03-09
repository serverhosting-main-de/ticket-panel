import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import styled from "styled-components";

const DashboardContainer = styled.div`
  padding: 20px;
  font-family: Arial, sans-serif;
  background-color: #121212;
  color: #ffffff;
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

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
  background-color: #1e1e1e;
  color: #ffffff;
  border-radius: 8px;
  overflow: hidden;
`;

const TableHeader = styled.thead`
  background-color: #333333;
  text-align: left;
`;

const TableRow = styled.tr`
  &:nth-child(even) {
    background-color: #2a2a2a;
  }
  &:hover {
    background-color: #3a3a3a;
  }
`;

const TableCell = styled.td`
  padding: 12px 15px;
  border-bottom: 1px solid #444444;
`;

const ActionButton = styled.button`
  padding: 8px 15px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #0056b3;
  }
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
`;

const ModalContent = styled.div`
  background-color: #1e1e1e;
  padding: 20px;
  border-radius: 8px;
  width: 80%;
  max-height: 80%;
  overflow-y: auto;
  position: relative;
  color: #ffffff;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #ffffff;
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
  const [modalContent, setModalContent] = useState(null);

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
          if (!roleResponse.data.hasRole) {
            fetchedTickets = fetchedTickets.filter((ticket) =>
              ticket.fileName.includes(userId)
            );
          }
          setTickets(fetchedTickets);
          setLoading(false);
        })
        .catch(() => {
          setError(
            "Fehler beim Laden der Daten. Bitte versuche es später noch einmal."
          );
          setLoading(false);
        });
    }
  }, [username, userId, avatar, navigate]);

  const openTicketChat = (ticketFileName) => {
    axios
      .get(
        `https://backendtickets.wonder-craft.de/ticket-content/${ticketFileName}`
      )
      .then((response) => {
        setModalContent(response.data);
      });
  };

  const closeModal = () => setModalContent(null);

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
        <h1>Willkommen, {username}!</h1>
      </UserInfo>

      <p>
        {hasRole
          ? "Du hast Admin/Supporter Rechte."
          : "Du hast Benutzer Rechte."}
      </p>

      <h2>Deine Tickets</h2>
      {tickets.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell>
                <strong>Titel</strong>
              </TableCell>
              <TableCell>
                <strong>Datum</strong>
              </TableCell>
              <TableCell>
                <strong>Aktion</strong>
              </TableCell>
            </TableRow>
          </TableHeader>
          <tbody>
            {tickets.map((ticket) => (
              <TableRow key={ticket.id}>
                <TableCell>{ticket.title}</TableCell>
                <TableCell>{ticket.date}</TableCell>
                <TableCell>
                  <ActionButton onClick={() => openTicketChat(ticket.fileName)}>
                    Anzeigen
                  </ActionButton>
                </TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>
      ) : (
        <p>Keine Tickets gefunden.</p>
      )}

      {modalContent && (
        <Modal onClick={closeModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <CloseButton onClick={closeModal}>×</CloseButton>
            <div dangerouslySetInnerHTML={{ __html: modalContent }} />
          </ModalContent>
        </Modal>
      )}
    </DashboardContainer>
  );
}

export default Dashboard;
