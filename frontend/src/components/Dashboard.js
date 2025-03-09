import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import styled from "styled-components";

const DashboardContainer = styled.div`
  padding: 20px !important;
  font-family: Arial, sans-serif !important;
  background-color: #121212 !important;
  color: #ffffff !important;
`;

const UserInfo = styled.div`
  display: flex !important;
  align-items: center !important;
  margin-bottom: 20px !important;
`;

const Avatar = styled.img`
  width: 50px !important;
  height: 50px !important;
  border-radius: 50% !important;
  margin-right: 10px !important;
`;

const Table = styled.table`
  width: 100% !important;
  border-collapse: collapse !important;
  margin-top: 20px !important;
  background-color: #1e1e1e !important;
  color: #ffffff !important;
`;

const TableHeader = styled.thead`
  background-color: #333333 !important;
`;

const TableRow = styled.tr`
  &:nth-child(even) {
    background-color: #2a2a2a !important;
  }
  &:hover {
    background-color: #3a3a3a !important;
  }
`;

const TableCell = styled.td`
  padding: 10px !important;
  border: 1px solid #444444 !important;
`;

const Modal = styled.div`
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  width: 100% !important;
  height: 100% !important;
  background-color: rgba(0, 0, 0, 0.7) !important;
  display: flex !important;
  justify-content: center !important;
  align-items: center !important;
`;

const ModalContent = styled.div`
  background-color: #1e1e1e !important;
  padding: 20px !important;
  border-radius: 8px !important;
  width: 80% !important;
  max-height: 80% !important;
  overflow-y: auto !important;
  position: relative !important;
  color: #ffffff !important;
`;

const CloseButton = styled.button`
  position: absolute !important;
  top: 10px !important;
  right: 10px !important;
  background: none !important;
  border: none !important;
  font-size: 20px !important;
  cursor: pointer !important;
  color: #ffffff !important;
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
                  <button onClick={() => openTicketChat(ticket.fileName)}>
                    Anzeigen
                  </button>
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
