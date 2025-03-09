import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import styled from "styled-components";

const DashboardContainer = styled.div`
  padding: 30px;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  background: linear-gradient(135deg, #2c3e50, #34495e);
  color: #ecf0f1;
  min-height: 100vh;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 30px;
`;

const Avatar = styled.img`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  margin-right: 15px;
  border: 2px solid #3498db;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 30px;
  background-color: rgba(0, 0, 0, 0.3);
  color: #ecf0f1;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
`;

const TableHeader = styled.thead`
  background-color: rgba(52, 73, 94, 0.5);
  text-align: left;
`;

const TableRow = styled.tr`
  &:nth-child(even) {
    background-color: rgba(0, 0, 0, 0.2);
  }
  &:hover {
    background-color: rgba(0, 0, 0, 0.4);
  }
`;

const TableCell = styled.td`
  padding: 15px 20px;
  border-bottom: 1px solid rgba(236, 240, 241, 0.1);
`;

const ActionButton = styled.button`
  padding: 10px 20px;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.2s ease;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.2);

  &:hover {
    background-color: #2980b9;
    transform: translateY(-2px);
  }
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
`;

const ModalContent = styled.div`
  background-color: rgba(0, 0, 0, 0.7);
  padding: 30px;
  border-radius: 12px;
  width: 80%;
  max-height: 80%;
  overflow-y: auto;
  position: relative;
  color: #ecf0f1;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.5);
`;

const CloseButton = styled.button`
  position: absolute;
  top: 15px;
  right: 15px;
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #ecf0f1;
`;

function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const username =
    searchParams.get("username") || localStorage.getItem("username");
  const userId = searchParams.get("userId") || localStorage.getItem("userId");
  const avatar = searchParams.get("avatar") || localStorage.getItem("avatar");
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
