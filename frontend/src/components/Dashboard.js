import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import styled from "styled-components";
import io from "socket.io-client";

// Styled Components (für das Styling)
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
  position: relative;
`;

const Avatar = styled.img`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  margin-right: 15px;
  border: 2px solid #3498db;
`;

const StatusIndicator = styled.div`
  width: 15px;
  height: 15px;
  border-radius: 50%;
  background-color: ${({ status }) =>
    status === "online" ? "#2ecc71" : "#e74c3c"};
  margin-left: auto;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
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

// Modal-Komponenten
const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: #34495e;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
  max-width: 80%;
  max-height: 80%;
  overflow-y: auto;
  position: relative;
  color: white;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  font-size: 24px;
  color: #ecf0f1;
  cursor: pointer;
`;

// Haupt-Dashboard-Komponente
function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const username = searchParams.get("username");
  const userId = searchParams.get("userId");
  const avatar = searchParams.get("avatar");

  const [tickets, setTickets] = useState([]);
  const [hasRole, setHasRole] = useState(null);
  const [status, setStatus] = useState("offline"); //Online Status
  const [socket, setSocket] = useState(null); //Socket
  const [modalContent, setModalContent] = useState(null); //Modal State, jetzt für formatierten Chat-Verlauf
  const [ticketViewers, setTicketViewers] = useState({}); // Ticket-Viewer-State
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

    const fetchData = async () => {
      if (userId) {
        try {
          const roleResponse = await axios.get(
            `https://backendtickets.wonder-craft.de/check-role/${userId}`
          );
          setHasRole(roleResponse.data.hasRole);
          setStatus(roleResponse.data.status);

          const ticketsResponse = await axios.get(
            "https://backendtickets.wonder-craft.de/tickets"
          );
          setTickets(ticketsResponse.data);
        } catch (error) {
          console.error("Error:", error);
          setError(
            "Fehler beim Laden der Daten. Bitte versuche es später noch einmal."
          );
        } finally {
          setLoading(false);
        }
      }
    };

    fetchData();

    const newSocket = io("https://backendtickets.wonder-craft.de");
    setSocket(newSocket);

    newSocket.on("ticketsUpdated", (updatedTickets) => {
      setTickets(updatedTickets);
    });

    newSocket.on("updateTicketViewers", (ticketId, viewers, avatars) => {
      setTicketViewers((prevViewers) => ({
        ...prevViewers,
        [ticketId]: { viewers, avatars },
      }));
    });

    return () => {
      newSocket.disconnect();
    };
  }, [username, userId, avatar, navigate]);

  const openTicketChat = async (ticketFileName, ticketId) => {
    // 1. Chat-Verlauf vom Backend holen
    try {
      const response = await axios.get(
        `https://backendtickets.wonder-craft.de/api/tickets/${ticketId}/chat`
      );
      const chatHistory = response.data;

      // 2. Chat-Verlauf formatieren (HTML)
      const formattedChatHistory = chatHistory
        .map(
          (msg) => `
              <div>
                <img src="${msg.avatar}" alt="Avatar" style="width: 20px; height: 20px; border-radius: 50%; margin-right: 5px;" />
                <strong>${msg.author}</strong>: ${msg.content}
              </div>
            `
        )
        .join("");

      setModalContent(formattedChatHistory); //  Chatverlauf setzen

      // Ticket als geöffnet markieren (für Viewer-Anzeige, wichtig für Updates)
      if (socket) {
        socket.emit(
          "ticketOpened",
          ticketId,
          userId,
          avatar?.split("/").pop().split(".")[0]
        );
      }
    } catch (error) {
      console.error("Error fetching chat history:", error);
      setModalContent("Fehler beim Laden des Chatverlaufs."); //  Fehlermeldung
    }
  };

  const closeModal = () => {
    setModalContent(null);
    //Sende ticketClosed, wenn Modal geschlossen wird.
    if (socket) {
      socket.emit(
        "ticketClosed",
        tickets.find((t) => t.fileName === modalContent?.ticketId)?.threadID,
        userId
      );
    }
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
        <h1>Willkommen, {username}!</h1>
        <StatusIndicator status={status} />
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
                <strong>Ersteller</strong>
              </TableCell>
              <TableCell>
                <strong>Kategorie</strong>
              </TableCell>
              <TableCell>
                <strong>Status</strong>
              </TableCell>
              <TableCell>
                <strong>Geschlossen von</strong>
              </TableCell>
              <TableCell>
                <strong>Geschlossen am</strong>
              </TableCell>
              <TableCell>
                <strong>Aktion</strong>
              </TableCell>
              <TableCell>
                <strong>Aktuelle Bearbeiter</strong>
              </TableCell>
            </TableRow>
          </TableHeader>
          <tbody>
            {tickets.map((ticket) => (
              <TableRow key={ticket.fileName}>
                <TableCell>{ticket.title}</TableCell>
                <TableCell>{ticket.creator}</TableCell>
                <TableCell>{ticket.category}</TableCell>
                <TableCell>{ticket.status}</TableCell>
                <TableCell>{ticket.closedBy}</TableCell>
                <TableCell>{ticket.closedAt}</TableCell>
                <TableCell>
                  <ActionButton
                    onClick={() =>
                      openTicketChat(ticket.fileName, ticket.fileName)
                    }
                  >
                    Anzeigen
                  </ActionButton>
                </TableCell>
                <TableCell>
                  {ticketViewers[ticket.fileName]?.viewers?.map((viewerId) => (
                    <Avatar
                      key={viewerId}
                      src={`https://cdn.discordapp.com/avatars/${viewerId}/${
                        ticketViewers[ticket.fileName]?.avatars[viewerId]
                      }.png`}
                      alt="Avatar"
                      style={{
                        width: "30px",
                        height: "30px",
                        marginRight: "5px",
                      }}
                    />
                  ))}
                </TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>
      ) : (
        <p>Keine Tickets gefunden.</p>
      )}

      {modalContent && (
        <Modal>
          <ModalContent>
            <CloseButton onClick={closeModal}>×</CloseButton>
            <div dangerouslySetInnerHTML={{ __html: modalContent }} />
          </ModalContent>
        </Modal>
      )}
    </DashboardContainer>
  );
}

export default Dashboard;
