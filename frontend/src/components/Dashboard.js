import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import styled, { keyframes } from "styled-components";
import io from "socket.io-client";

// Styled Components
const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const DashboardContainer = styled.div`
  padding: 40px;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  background: linear-gradient(135deg, #1e1e2f, #2a2a40);
  color: #ecf0f1;
  min-height: 100vh;
  animation: ${fadeIn} 0.5s ease;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 30px;
  position: relative;
  border-bottom: 2px solid rgba(236, 240, 241, 0.1);
  padding-bottom: 20px;
`;

const Avatar = styled.img`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  margin-right: 20px;
  border: 3px solid #3498db;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
`;

const StatusIndicator = styled.div`
  width: 18px;
  height: 18px;
  border-radius: 50%;
  margin-left: auto;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  background-color: ${({ status }) => {
    switch (status) {
      case "online":
        return "#2ecc71";
      case "idle":
        return "#f1c40f";
      case "dnd":
        return "#e74c3c";
      case "offline":
      default:
        return "#747f8d";
    }
  }};
  position: absolute;
  bottom: 15px;
  left: 60px;
  border: 2px solid #34495e;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
`;

const TableHeader = styled.thead`
  background-color: rgba(0, 0, 0, 0.2);
  th {
    padding: 15px 20px;
    text-align: left;
    font-weight: 600;
    border-bottom: 2px solid rgba(236, 240, 241, 0.1);
    &:first-child {
      border-radius: 10px 0 0 0;
    }
    &:last-child {
      border-radius: 0 10px 0 0;
    }
  }
`;

const TableRow = styled.tr`
  &:nth-child(even) {
    background-color: rgba(0, 0, 0, 0.1);
  }
  &:hover {
    background-color: rgba(52, 152, 219, 0.1);
  }
`;

const TableCell = styled.td`
  padding: 12px 20px;
  border-bottom: 1px solid rgba(236, 240, 241, 0.05);
`;

const ActionButton = styled.button`
  padding: 8px 16px;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.1s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);

  &:hover {
    background-color: #2980b9;
    transform: scale(1.05);
  }
  &:active {
    transform: scale(0.95);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  }
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100% !important;
  height: 100% !important;
  background-color: rgba(0, 0, 0, 0.8) !important;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000 !important;
`;

const ModalContent = styled.div`
  background-color: #2c3e50 !important;
  padding: 20px !important;
  border-radius: 15px !important;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.5) !important;
  width: 90% !important;
  max-width: 1200px !important;
  height: 90% !important;
  max-height: 800px !important;
  overflow-y: auto !important;
  position: relative !important;
  color: #ecf0f1 !important;
`;

const ChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px !important;
  width: 100% !important;
  height: 100% !important;
  padding: 10px !important;
`;

const ChatMessage = styled.div`
  display: flex;
  align-items: center;
  gap: 10px !important;
  padding: 10px !important;
  background-color: rgba(255, 255, 255, 0.1) !important;
  border-radius: 10px !important;
`;

const ChatAvatar = styled.img`
  width: 40px !important;
  height: 40px !important;
  border-radius: 50% !important;
`;

const ChatAuthor = styled.strong`
  color: #3498db !important;
`;

const ChatContent = styled.span`
  color: #ecf0f1 !important;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 15px;
  right: 15px;
  background: none;
  border: none;
  font-size: 30px;
  color: #ecf0f1;
  cursor: pointer;
  transition: transform 0.3s ease;

  &:hover {
    transform: scale(1.2);
  }
`;

const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const LoadingSpinner = styled.div`
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid #3498db;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: ${rotate} 1s linear infinite;
  margin: 50px auto;
`;

const LogoutButton = styled(ActionButton)`
  background-color: #e74c3c;
  margin-left: auto;

  &:hover {
    background-color: #c0392b;
  }
`;

// Hilfsfunktion für API-Aufrufe
const fetchData = async (url, options = {}) => {
  try {
    const response = await axios.get(url, options);
    return response.data;
  } catch (error) {
    console.error(`Fehler beim Abrufen von ${url}:`, error);
    throw error;
  }
};

function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  const [tickets, setTickets] = useState([]);
  const [hasRole, setHasRole] = useState(null);
  const [status, setStatus] = useState("offline");
  const [socket, setSocket] = useState(null);
  const [modalContent, setModalContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState(() => {
    const storedUserData = localStorage.getItem("userData");
    return storedUserData ? JSON.parse(storedUserData) : null;
  });

  const isLoggedIn = useMemo(() => !!userData, [userData]);

  const saveUserData = useCallback((data) => {
    localStorage.setItem("userData", JSON.stringify(data));
    setUserData(data);
  }, []);

  const clearUserData = useCallback(() => {
    localStorage.removeItem("userData");
    setUserData(null);
  }, []);

  // Verarbeite Query-Parameter und setze Benutzerdaten
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const urlUsername = searchParams.get("username");
    const urlUserId = searchParams.get("userId");
    const urlAvatar = searchParams.get("avatar");

    if (urlUsername && urlUserId) {
      const newUserData = {
        username: urlUsername,
        userId: urlUserId,
        avatar: urlAvatar
          ? `https://cdn.discordapp.com/avatars/${urlUserId}/${urlAvatar}.png`
          : "",
      };
      saveUserData(newUserData);
      navigate("/dashboard", { replace: true });
    }
  }, [location.search, saveUserData, navigate]);

  // Überprüfe den Authentifizierungsstatus
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const authStatus = await fetchData(
          "https://backendtickets.wonder-craft.de/api/auth/status",
          { withCredentials: true }
        );

        if (authStatus.isLoggedIn) {
          saveUserData(authStatus);
        } else if (!userData) {
          navigate("/login");
          return;
        }

        if (authStatus.userId || userData?.userId) {
          try {
            const roleResponse = await fetchData(
              `https://backendtickets.wonder-craft.de/check-role/${
                authStatus.userId || userData.userId
              }`
            );
            // Überprüfe, ob die Antwort einen Fehler enthält
            if (roleResponse.error) {
              setError(roleResponse.error); // Setze die Fehlermeldung
              setHasRole(false); // Setze hasRole auf false
              setStatus("offline"); // Setze den Status auf offline
            } else {
              // Wenn kein Fehler vorliegt, aktualisiere hasRole und status
              setHasRole(roleResponse.hasRole);
              setStatus(roleResponse.status);
            }
          } catch (error) {
            // Fehlerbehandlung für Netzwerkfehler oder andere Ausnahmen
            console.error("Fehler beim Abrufen der Benutzerrolle:", error);
            setError("Fehler beim Laden von Benutzerdaten.");
            setHasRole(false); // Setze hasRole auf false
            setStatus("offline"); // Setze den Status auf offline
          }
        }
      } catch (error) {
        console.error("Authentication check failed:", error);
        if (!userData) {
          navigate("/login");
          return;
        }
      } finally {
        setLoading(false);
      }
    };

    if (!userData) {
      navigate("/login");
    } else {
      checkAuthStatus();
    }
  }, [navigate, userData, saveUserData]);

  useEffect(() => {
    // Funktion zum Abrufen der Tickets
    const fetchTickets = async () => {
      try {
        const response = await axios.get(
          "https://backendtickets.wonder-craft.de/api/tickets",
          { withCredentials: true }
        );
        console.log("API-Antwort:", response.data);

        // Tickets aus der API-Antwort
        const tickets = response.data;

        // Filtere die Tickets basierend auf der Rolle und dem Ersteller
        const filteredTickets = hasRole
          ? tickets
          : tickets.filter((ticket) => ticket.creatorID === userData.userId); // Andernfalls filtere die Tickets nach dem Ersteller

        // Setze die gefilterten Tickets im State
        setTickets(filteredTickets);
      } catch (error) {
        console.error("Fehler beim Abrufen der Tickets:", error);
        if (error.response) {
          // Server hat geantwortet, aber mit einem Fehler
          console.error("Statuscode:", error.response.status);
          console.error("Fehlermeldung:", error.response.data);
          setError(
            `Fehler beim Laden der Tickets: ${error.response.data.error}`
          );
        } else if (error.request) {
          // Anfrage wurde gemacht, aber keine Antwort erhalten
          console.error("Keine Antwort vom Server:", error.request);
          setError("Keine Antwort vom Server. Bitte überprüfe die Verbindung.");
        } else {
          // Anderer Fehler
          console.error("Fehler:", error.message);
          setError(`Fehler beim Laden der Tickets: ${error.message}`);
        }
      }
    };

    if (hasRole !== null && userData.userId) {
      fetchTickets();
      setTickets((prevTickets) =>
        prevTickets.filter((t) => t.creatorID === userData.userId)
      );
    }
  }, [hasRole, userData.userId]);

  // Socket.IO-Verbindung herstellen
  useEffect(() => {
    const newSocket = io("https://backendtickets.wonder-craft.de");
    setSocket(newSocket);

    newSocket.on("ticketsUpdated", (updatedTickets) => {
      setTickets(updatedTickets);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Chatverlauf öffnen
  const openTicketChat = useCallback(
    async (threadId) => {
      const ticketById = tickets.find((t) => t.threadID === threadId);
      if (!ticketById) {
        setModalContent("Ticket nicht gefunden.");
        return;
      }

      if (ticketById.status === true) {
        try {
          const chatHistory = await fetchData(
            `https://backendtickets.wonder-craft.de/api/tickets/${threadId}/chat`
          );

          const formattedChatHistory = (
            <ChatContainer>
              {chatHistory.map((msg, index) => (
                <ChatMessage key={index}>
                  <ChatAvatar src={msg.avatar} alt="Avatar" />
                  <ChatAuthor>{msg.author}</ChatAuthor>
                  <ChatContent>{msg.content}</ChatContent>
                </ChatMessage>
              ))}
            </ChatContainer>
          );

          setModalContent({
            content: formattedChatHistory,
            threadID: threadId, // Speichere die threadID im modalContent
          });
        } catch (error) {
          setModalContent({
            content: "Fehler beim Laden des Chatverlaufs.",
            threadID: threadId,
          });
        }
      } else {
        // Ticket ist geschlossen: Lade die HTML-Datei
        try {
          const response = await fetch(
            `https://backendtickets.wonder-craft.de/tickets/${threadId}.html`
          );

          if (!response.ok) {
            throw new Error("HTML-Datei nicht gefunden.");
          }

          const htmlContent = await response.text();
          setModalContent({
            content: (
              <div
                dangerouslySetInnerHTML={{ __html: htmlContent }}
                style={{ whiteSpace: "pre-wrap" }}
              />
            ),
            threadID: threadId, // Speichere die threadID im modalContent
          });
        } catch (error) {
          console.error("Fehler beim Laden der HTML-Datei:", error);
          setModalContent({
            content: "Fehler beim Laden der HTML-Datei.",
            threadID: threadId,
          });
        }
      }
    },
    [tickets]
  );

  // Modal schließen
  const closeModal = useCallback(() => {
    setModalContent(null);
  }, []);

  // Logout
  const handleLogout = () => {
    clearUserData();
    navigate("/login");
  };

  if (loading) {
    return (
      <DashboardContainer>
        <LoadingSpinner />
      </DashboardContainer>
    );
  }

  if (error) {
    return <DashboardContainer>{error}</DashboardContainer>;
  }

  return (
    <DashboardContainer>
      {isLoggedIn ? (
        <>
          <UserInfo>
            {userData?.avatar && <Avatar src={userData.avatar} alt="Avatar" />}
            <StatusIndicator status={status} />
            <h1>Willkommen, {userData.username}!</h1>
            <LogoutButton onClick={handleLogout}>Logout</LogoutButton>
          </UserInfo>

          <p>
            {hasRole
              ? "Du hast Admin/Supporter Rechte."
              : "Du hast Benutzer Rechte."}
          </p>

          <h1>Tickets</h1>
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell>
                  <strong>Kategorie</strong>
                </TableCell>
                <TableCell>
                  <strong>Ticket ID</strong>
                </TableCell>
                <TableCell>
                  <strong>Ersteller</strong>
                </TableCell>
                <TableCell>
                  <strong>Ersteller ID</strong>
                </TableCell>
                <TableCell>
                  <strong>Status</strong>
                </TableCell>
                <TableCell>
                  <strong>Claimed by</strong>
                </TableCell>
                <TableCell>
                  <strong>Erstellt am</strong>
                </TableCell>
                <TableCell>
                  <strong>Geschlossen am</strong>
                </TableCell>
                <TableCell>
                  <strong>Geschlossen von</strong>
                </TableCell>
                <TableCell>
                  <strong>Transkript</strong>
                </TableCell>
              </TableRow>
            </TableHeader>
            <tbody>
              {tickets.length > 0 ? (
                tickets.map((ticket) => (
                  <TableRow key={ticket.threadID}>
                    <TableCell>{ticket.category}</TableCell>
                    <TableCell>{ticket.threadID}</TableCell>
                    <TableCell>{ticket.creator}</TableCell>
                    <TableCell>{ticket.creatorID}</TableCell>
                    <TableCell>
                      {ticket.status ? "Offen" : "Geschlossen"}
                    </TableCell>
                    <TableCell>
                      {ticket.claimedBy ? ticket.claimedBy : "-"}
                    </TableCell>
                    <TableCell>
                      {ticket.date
                        ? new Date(ticket.date).toLocaleString()
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {ticket.closedAt &&
                      !isNaN(new Date(ticket.closedAt).getTime())
                        ? new Date(ticket.closedAt).toLocaleString()
                        : "-"}
                    </TableCell>
                    <TableCell>{ticket.closedBy || "-"}</TableCell>
                    <TableCell>
                      <ActionButton
                        onClick={() => openTicketChat(ticket.threadID)}
                      >
                        Anzeigen
                      </ActionButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan="10" style={{ textAlign: "center" }}>
                    Keine Tickets gefunden.
                  </TableCell>
                </TableRow>
              )}
            </tbody>
          </Table>
          {modalContent && (
            <Modal>
              <ModalContent>
                <CloseButton onClick={closeModal}>×</CloseButton>
                {modalContent.content}
              </ModalContent>
            </Modal>
          )}
        </>
      ) : (
        navigate("/login")
      )}
    </DashboardContainer>
  );
}

export default Dashboard;
