import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import styled, { keyframes } from "styled-components"; // keyframes für Animationen
import io from "socket.io-client";

// Styled Components (bleiben größtenteils gleich, mit kleinen Anpassungen)
// ... (Deine Styled Components - wie in der vorherigen Antwort) ...
// Haupt-Dashboard-Komponente

const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const DashboardContainer = styled.div`
  padding: 30px;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  background: linear-gradient(135deg, #2c3e50, #34495e);
  color: #ecf0f1;
  min-height: 100vh;
  animation: ${fadeIn} 0.5s ease; /* Fade-in Animation */
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 30px;
  position: relative;
  border-bottom: 2px solid rgba(236, 240, 241, 0.2);
  padding-bottom: 20px;
`;

const Avatar = styled.img`
  width: 70px;
  height: 70px;
  border-radius: 50%;
  margin-right: 20px;
  border: 3px solid #3498db;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23);
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
        return "#2ecc71"; // Grün
      case "idle":
        return "#f1c40f"; // Gelb/Orange
      case "dnd":
        return "#e74c3c"; // Rot
      case "offline":
      default:
        return "#747f8d"; // Grau (oder eine andere Farbe für Offline/Unsichtbar)
    }
  }};
  position: absolute;
  bottom: 10px;
  left: 50px; /* Position relativ zum UserInfo Container */
  border: 2px solid #34495e;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
`;

// Verbesserte Tabelle
const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
  background-color: rgba(255, 255, 255, 0.1); // Leicht transparentes Weiß
  border-radius: 10px;
  overflow: hidden; // Für abgerundete Ecken
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
`;

const TableHeader = styled.thead`
  background-color: rgba(0, 0, 0, 0.2); // Etwas dunklerer Header
  th {
    padding: 15px 20px;
    text-align: left;
    font-weight: 600;
    border-bottom: 2px solid rgba(236, 240, 241, 0.3);
    &:first-child {
      border-radius: 10px 0 0 0; // Abgerundete Ecken für die erste Zelle
    }
    &:last-child {
      border-radius: 0 10px 0 0; // Abgerundete Ecken für die letzte Zelle
    }
  }
`;

const TableRow = styled.tr`
  &:nth-child(even) {
    background-color: rgba(0, 0, 0, 0.1); // Leicht abgedunkelte Zeilen
  }
  &:hover {
    background-color: rgba(52, 152, 219, 0.2); /* Hover-Farbe */
  }
`;

const TableCell = styled.td`
  padding: 12px 20px;
  border-bottom: 1px solid rgba(236, 240, 241, 0.1);
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
    transform: scale(1.05); /* Leichter Zoom-Effekt */
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
  background-color: rgba(0, 0, 0, 0.7); // Stärkerer Hintergrund
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: #2c3e50; // Dunklerer Hintergrund
  padding: 40px;
  border-radius: 15px; // Stärker abgerundete Ecken
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.5); // Stärkerer Schatten
  max-width: 90%; // Etwas schmaler
  max-height: 90%; // Etwas weniger hoch
  overflow-y: auto;
  position: relative;
  color: #ecf0f1; // Hellere Schriftfarbe
`;

const CloseButton = styled.button`
  position: absolute;
  top: 15px;
  right: 15px;
  background: none;
  border: none;
  font-size: 30px; // Größer
  color: #ecf0f1;
  cursor: pointer;
  transition: transform 0.3s ease; // Sanfter Übergang

  &:hover {
    transform: scale(1.2); // Vergrößern beim Hover
  }
`;

// Ladeanimation (Spinner)
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
  margin: 50px auto; // Zentriert
`;
function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  const [tickets, setTickets] = useState([]);
  const [hasRole, setHasRole] = useState(null);
  const [status, setStatus] = useState("offline");
  const [socket, setSocket] = useState(null);
  const [modalContent, setModalContent] = useState(null);
  const [ticketViewers, setTicketViewers] = useState({});
  const [loading, setLoading] = useState(true); // Initial auf true setzen
  const [error, setError] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Initial auf false
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    // Funktion, um URL-Parameter zu verarbeiten und im localStorage zu speichern
    const handleUrlParams = () => {
      const searchParams = new URLSearchParams(location.search);
      const urlUsername = searchParams.get("username");
      const urlUserId = searchParams.get("userId");
      const urlAvatar = searchParams.get("avatar");

      if (urlUsername && urlUserId) {
        localStorage.setItem("username", urlUsername);
        localStorage.setItem("userId", urlUserId);
        localStorage.setItem("avatar", urlAvatar || "");
        localStorage.setItem("loggedIn", "true");
        setIsLoggedIn(true); // Setze isLoggedIn, wenn Daten im localStorage
        setUserData({
          //Setze UserData direkt, wenn die URL Parameter hat.
          username: urlUsername,
          userId: urlUserId,
          avatar: urlAvatar,
        });
        return true; // URL-Parameter wurden verarbeitet
      }
      return false; // Keine URL Parameter
    };

    // Funktion um LocalStorage zu handhaben, WENN keine URL Parameter da sind
    const handleLocalStorage = () => {
      if (localStorage.getItem("loggedIn") === "true") {
        const storedUsername = localStorage.getItem("username");
        const storedUserId = localStorage.getItem("userId");
        const storedAvatar = localStorage.getItem("avatar");

        if (storedUsername && storedUserId) {
          setUserData({
            username: storedUsername,
            userId: storedUserId,
            avatar: storedAvatar,
          });
          setIsLoggedIn(true);
          return true; // LocalStorage Daten sind vorhanden und gültig.
        }
      }
      return false; // Keine gültigen LocalStorage Daten
    };

    const checkAuthStatus = async () => {
      console.log("checkAuthStatus gestartet");
      try {
        const response = await axios.get(
          "https://backendtickets.wonder-craft.de/api/auth/status",
          { withCredentials: true }
        );
        console.log("checkAuthStatus Antwort:", response.data);

        if (response.data.isLoggedIn) {
          setIsLoggedIn(true); // Setze isLoggedIn *vor* dem Laden weiterer Daten
          setUserData(response.data); // Benutzerdaten aus der Session

          // Daten abrufen (Tickets, Rolle, Status) – jetzt innerhalb des if-Blocks
          try {
            const roleResponse = await axios.get(
              `https://backendtickets.wonder-craft.de/check-role/${response.data.userId}`
            );
            setHasRole(roleResponse.data.hasRole);
            setStatus(roleResponse.data.status);

            const ticketsResponse = await axios.get(
              "https://backendtickets.wonder-craft.de/tickets"
            );
            setTickets(ticketsResponse.data);
          } catch (error) {
            console.error("Fehler beim Abrufen von Rolle/Tickets:", error);
            setError(
              "Fehler beim Laden von Daten. Bitte versuche es später noch einmal."
            );
          }
        } else {
          // Nicht eingeloggt, localStorage prüfen
          if (!handleLocalStorage()) {
            navigate("/login"); // Umleiten, wenn auch im localStorage nichts ist
            return; // Beende die Ausführung hier.
          }
        }
      } catch (error) {
        console.error("Authentication check failed:", error);
        // Fehler, aber trotzdem localStorage prüfen (Fallback)
        if (!handleLocalStorage()) {
          navigate("/login"); // Umleiten, wenn keine Session und kein LocalStorage
          return;
        }
      } finally {
        console.log("checkAuthStatus beendet");
        setLoading(false); // Ladezustand IMMER beenden (auch im Fehlerfall)
      }
    };

    // Hauptablauf:
    if (!handleUrlParams()) {
      //Verarbeite URL Params zuerst
      if (!handleLocalStorage()) {
        //Wenn keine URL params und kein LocalStorage, dann Auth Check
        checkAuthStatus();
      } else {
        //Wenn LocalStorage, dann direkt nicht mehr laden.
        setLoading(false);
      }
    } else {
      //Wenn URL Params, dann direkt nicht mehr laden.
      setLoading(false);
    }

    // Socket.IO-Verbindung (außerhalb von checkAuthStatus, aber innerhalb useEffect)
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
  }, [navigate, location.search]); // Abhängigkeiten: navigate und location.search

  const openTicketChat = async (ticketFileName, ticketId) => {
    try {
      const response = await axios.get(
        `https://backendtickets.wonder-craft.de/api/tickets/${ticketId}/chat`
      );
      const chatHistory = response.data;

      // Chat-Verlauf als JSX formatieren
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

      // Ticket als geöffnet markieren (für Viewer-Anzeige)
      if (socket && userData) {
        socket.emit(
          "ticketOpened",
          ticketId,
          userData.userId,
          userData.avatar?.split("/").pop().split(".")[0]
        );
      } else if (socket) {
        // Fallback, falls userData noch nicht gesetzt ist
        const storedUserId = localStorage.getItem("userId");
        const storedAvatar = localStorage.getItem("avatar");
        socket.emit(
          "ticketOpened",
          ticketId,
          storedUserId,
          storedAvatar?.split("/")?.pop()?.split(".")?.[0]
        );
      }
    } catch (error) {
      console.error("Error fetching chat history:", error);
      setModalContent("Fehler beim Laden des Chatverlaufs.");
    }
  };

  const closeModal = () => {
    setModalContent(null);
    // Sende ticketClosed, wenn Modal geschlossen wird.
    if (socket && userData) {
      const currentTicket = tickets.find(
        (t) => t.fileName === modalContent?.ticketId
      );
      if (currentTicket) {
        socket.emit("ticketClosed", currentTicket.threadID, userData.userId);
      }
    } else if (socket) {
      //fallback
      const storedUserId = localStorage.getItem("userId");
      const currentTicket = tickets.find(
        (t) => t.fileName === modalContent?.ticketId
      );
      if (currentTicket) {
        socket.emit("ticketClosed", currentTicket.threadID, storedUserId);
      }
    }
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

  // Zeige Dashboard-Inhalt NUR, wenn isLoggedIn true ist.
  return (
    <DashboardContainer>
      {isLoggedIn ? (
        <>
          <UserInfo>
            {/* Bevorzugt Avatar aus userData, dann aus localStorage, sonst kein Avatar */}
            {(userData?.avatar || localStorage.getItem("avatar")) && (
              <Avatar
                src={userData?.avatar || localStorage.getItem("avatar")}
                alt="Avatar"
              />
            )}
            <h1>
              Willkommen,{" "}
              {userData
                ? userData.username
                : localStorage.getItem("username") || "Benutzer"}
              !
            </h1>
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
                {tickets.map((ticket) => (
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
                {/* Rendere die Chat-Nachrichten direkt */}
                {modalContent}
              </ModalContent>
            </Modal>
          )}
        </>
      ) : (
        // Optional: Hier könntest du eine andere Komponente anzeigen (z.B. eine Info-Seite)
        <p>Nicht autorisiert, bitte einloggen.</p>
      )}
    </DashboardContainer>
  );
}

export default Dashboard;
