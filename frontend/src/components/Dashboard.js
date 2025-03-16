import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import styled, { keyframes } from "styled-components";
import ChatModal from "./ChatModal";

// Styled Components (unverändert)
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
  display: flex;
  align-items: center;
  justify-content: center;

  ${({ status }) =>
    status === "dnd" &&
    `
    &::before {
      content: "";
      position: absolute;
      width: 60%;
      height: 2px;
      background-color: #34495e;
      border-radius: 2px;
    }
  `}
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

const LoadingSpinner = styled.div`
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid #3498db;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 50px auto;

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

const LogoutButton = styled(ActionButton)`
  background-color: #e74c3c;
  margin-left: auto;

  &:hover {
    background-color: #c0392b;
  }
`;
function Dashboard() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [showChatModal, setShowChatModal] = useState(false);
  const [userData, setUserData] = useState(() => {
    const storedUserData = localStorage.getItem("userData");
    return storedUserData ? JSON.parse(storedUserData) : null;
  });

  const isLoggedIn = !!userData;
  const hasRole = userData?.hasRole || false;
  const status = userData?.status || "offline";

  // Funktion zum Abrufen von Daten mit JWT
  const fetchData = async (url) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Fehler beim Abrufen der Daten:", error);
      throw error;
    }
  };

  // Überprüfe den Authentifizierungsstatus
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const authStatus = await fetchData(
          "https://backendtickets.wonder-craft.de/api/auth/status"
        );

        if (authStatus.isLoggedIn) {
          const roleResponse = await fetchData(
            `https://backendtickets.wonder-craft.de/check-role/${authStatus.userId}`
          );

          const updatedUserData = {
            ...authStatus,
            hasRole: roleResponse.hasRole,
            status: roleResponse.status,
          };
          setUserData(updatedUserData);
          localStorage.setItem("userData", JSON.stringify(updatedUserData));
        } else {
          navigate("/login");
        }
      } catch (error) {
        console.error("Authentication check failed:", error);
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, [navigate]);

  // Tickets abrufen
  useEffect(() => {
    if (!userData) return;

    const fetchTickets = async () => {
      try {
        const response = await fetchData(
          "https://backendtickets.wonder-craft.de/api/tickets"
        );
        const ticketsData = response.data || [];
        const filteredTickets = hasRole
          ? ticketsData
          : ticketsData.filter(
              (ticket) => ticket.creatorID === userData.userId
            );
        setTickets(filteredTickets);
      } catch (error) {
        console.error("Fehler beim Abrufen der Tickets:", error);
        setError("Fehler beim Laden der Tickets.");
      }
    };

    fetchTickets();
  }, [hasRole, userData]);

  // Neue Funktionen für Chat/Details Handling
  const handleActionClick = (ticket) => {
    if (ticket.status) {
      setSelectedTicketId(ticket.threadID);
      setShowChatModal(true);
    } else {
      navigate(`/ticket/${ticket.threadID}`);
    }
  };

  const handleCloseModal = () => {
    setShowChatModal(false);
    setSelectedTicketId(null);
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userData");
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
      {isLoggedIn && userData.username != null ? (
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
                <TableCell>Kategorie</TableCell>
                <TableCell>Ticket ID</TableCell>
                <TableCell>Ersteller</TableCell>
                <TableCell>Ersteller ID</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Claimed by</TableCell>
                <TableCell>Erstellt am</TableCell>
                <TableCell>Geschlossen am</TableCell>
                <TableCell>Geschlossen von</TableCell>
                <TableCell>Aktion</TableCell>
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
                    <TableCell>{ticket.claimedBy || "-"}</TableCell>
                    <TableCell>
                      {ticket.date
                        ? new Date(ticket.date).toLocaleString()
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {ticket.closedAt
                        ? new Date(ticket.closedAt).toLocaleString()
                        : "-"}
                    </TableCell>
                    <TableCell>{ticket.closedBy || "-"}</TableCell>
                    <TableCell>
                      <ActionButton onClick={() => handleActionClick(ticket)}>
                        {ticket.status ? "Chat öffnen" : "Details"}
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

          {showChatModal && selectedTicketId && (
            <ChatModal ticketId={selectedTicketId} onClose={handleCloseModal} />
          )}
        </>
      ) : (
        navigate("/login")
      )}
    </DashboardContainer>
  );
}

export default Dashboard;
