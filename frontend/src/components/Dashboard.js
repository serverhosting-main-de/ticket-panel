import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import styled from "styled-components";
import io from "socket.io-client";

// Styled Components (für das Styling - bleiben gleich)
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
  const navigate = useNavigate();
  const location = useLocation(); // Holt die Location

  const [tickets, setTickets] = useState([]);
  const [hasRole, setHasRole] = useState(null);
  const [status, setStatus] = useState("offline");
  const [socket, setSocket] = useState(null);
  const [modalContent, setModalContent] = useState(null);
  const [ticketViewers, setTicketViewers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    // --- Search Params VERARBEITEN (als ERSTES) ---
    const searchParams = new URLSearchParams(location.search);
    const urlUsername = searchParams.get("username");
    const urlUserId = searchParams.get("userId");
    const urlAvatar = searchParams.get("avatar");

    if (urlUsername && urlUserId) {
      // Daten aus URL in localStorage speichern (ÜBERSCHREIBEN!)
      localStorage.setItem("username", urlUsername);
      localStorage.setItem("userId", urlUserId);
      localStorage.setItem("avatar", urlAvatar || ""); // Standardwert, falls avatar null
      localStorage.setItem("loggedIn", "true");
      setIsLoggedIn(true); // Setze isLoggedIn, wenn Daten in localStorage gespeichert werden.
      setUserData({
        //setze UserData mit den URL Parametern
        username: urlUsername,
        userId: urlUserId,
        avatar: urlAvatar,
      });
    }
    // -----------------------------------------------

    // Funktion um LocalStorage zu handhaben
    const handleLocalStorage = () => {
      const storedLoggedIn = localStorage.getItem("loggedIn");
      if (storedLoggedIn !== "true") {
        navigate("/login"); // Umleiten, wenn nicht eingeloggt
        return false;
      }

      // Benutzerdaten aus localStorage holen (nur username, userId, avatar)
      const storedUsername = localStorage.getItem("username");
      const storedUserId = localStorage.getItem("userId");
      const storedAvatar = localStorage.getItem("avatar");

      // Lokale Daten verwenden, wenn vorhanden
      if (storedUsername && storedUserId) {
        setUserData({
          username: storedUsername,
          userId: storedUserId,
          avatar: storedAvatar, // Kann null sein
        });
        setIsLoggedIn(true);
        return true; // LocalStorage Daten sind vorhanden.
      }
      return false; // Keine Local Storage Daten
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
          setIsLoggedIn(true);
          setUserData(response.data); // Benutzerdaten speichern

          // Daten abrufen (Tickets, Rolle, Status)
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
          if (!handleLocalStorage()) return; //Wenn handleLocalStorage false, dann return.
        }
      } catch (error) {
        console.error("Authentication check failed:", error);
        //Auch hier LocalStorage checken.
        if (!handleLocalStorage()) return; //Wenn handleLocalStorage false, dann return.
      } finally {
        console.log("checkAuthStatus beendet");
        setLoading(false); // Ladezustand IMMER beenden
      }
    };

    if (!handleLocalStorage()) {
      checkAuthStatus();
    } else {
      setLoading(false); // Ladezustand beenden, da Daten aus LocalStorage
    }

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
  }, [navigate, location.search]); // Abhängigkeit: navigate

  const openTicketChat = async (ticketFileName, ticketId) => {
    try {
      const response = await axios.get(
        `https://backendtickets.wonder-craft.de/api/tickets/${ticketId}/chat`
      );
      const chatHistory = response.data;

      // Chat-Verlauf formatieren (HTML)
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
    return <DashboardContainer>Lade Daten...</DashboardContainer>;
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
                <div dangerouslySetInnerHTML={{ __html: modalContent }} />
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
