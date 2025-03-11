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
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: #2c3e50;
  padding: 30px;
  border-radius: 15px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.5);
  max-width: 90%;
  max-height: 90%;
  overflow-y: auto;
  position: relative;
  color: #ecf0f1;
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
  const [ticketViewers, setTicketViewers] = useState({});
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
        console.log("API-Antwort:", response.data); // Logge die Antwort
        setTickets(response.data);
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

    // Rufe die Tickets beim Laden der Komponente ab
    fetchTickets();
  }, []); // Leeres Array bedeutet, dass dieser Effekt nur einmal beim Mounten ausgeführt wird

  // Socket.IO-Verbindung herstellen
  useEffect(() => {
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
  }, []);

  // Chatverlauf öffnen
  const openTicketChat = useCallback(
    async (ticketFileName, ticketId) => {
      try {
        const chatHistory = await fetchData(
          `https://backendtickets.wonder-craft.de/api/tickets/${ticketId}/chat`
        );

        const formattedChatHistory = chatHistory.map((msg, index) => (
          <div key={index}>
            <img
              src={msg.avatar}
              alt="Avatar"
              style={{
                width: "20px",
                height: "20px",
                borderRadius: "50%",
                marginRight: "5px",
              }}
            />
            <strong>{msg.author}</strong>: {msg.content}
          </div>
        ));

        setModalContent(formattedChatHistory);

        if (socket && userData) {
          socket.emit(
            "ticketOpened",
            ticketId,
            userData.userId,
            userData.avatar?.split("/").pop().split(".")[0]
          );
        }
      } catch (error) {
        setModalContent("Fehler beim Laden des Chatverlaufs.");
      }
    },
    [socket, userData]
  );

  // Modal schließen
  const closeModal = useCallback(() => {
    setModalContent(null);
    if (socket && userData) {
      const currentTicket = tickets.find(
        (t) => t.fileName === modalContent?.ticketId
      );
      if (currentTicket) {
        socket.emit("ticketClosed", currentTicket.threadID, userData.userId);
      }
    }
  }, [socket, userData, tickets, modalContent]);

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

          <h2>Deine Tickets</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell>
                  <strong>Ersteller</strong>
                </TableCell>
                <TableCell>
                  <strong>Kategorie</strong>
                </TableCell>
                <TableCell>
                  <strong>Thread ID</strong>
                </TableCell>
                <TableCell>
                  <strong>Erstellt</strong>
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
              {tickets.length > 0 ? (
                tickets.map((ticket) => (
                  <TableRow key={ticket.fileName}>
                    <TableCell>{ticket.creator}</TableCell>
                    <TableCell>{ticket.category}</TableCell>
                    <TableCell>{ticket.threadID}</TableCell>
                    <TableCell>
                      {ticket.date
                        ? new Date(ticket.date).toLocaleString()
                        : "-"}
                    </TableCell>
                    <TableCell>{ticket.status}</TableCell>
                    <TableCell>{ticket.closedBy}</TableCell>
                    <TableCell>
                      {ticket.closedAt
                        ? new Date(ticket.closedAt).toLocaleString()
                        : "-"}
                    </TableCell>
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
                      {ticketViewers[ticket.fileName]?.viewers?.map(
                        (viewerId) => (
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
                        )
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan="9" style={{ textAlign: "center" }}>
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
                {modalContent}
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
