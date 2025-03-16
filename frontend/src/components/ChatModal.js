import React, { useEffect, useState } from "react";
import axios from "axios";
import styled from "styled-components";

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
`;

const ModalContent = styled.div`
  background: white;
  padding: 20px;
  border-radius: 10px;
  width: 80%;
  max-width: 600px;
  color: black;
`;

const CloseButton = styled.button`
  background: #e74c3c;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 10px;
`;

function ChatModal({ ticketId, onClose }) {
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `https://backendtickets.wonder-craft.de/api/tickets/${ticketId}/chat`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setChatHistory(response.data);
      } catch (error) {
        console.error("Fehler beim Abrufen des Chat-Verlaufs:", error);
        setError("Fehler beim Laden des Chat-Verlaufs.");
      } finally {
        setLoading(false);
      }
    };

    fetchChatHistory();
  }, [ticketId]);

  if (loading) {
    return <div>Lade Chat-Verlauf...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <ModalOverlay>
      <ModalContent>
        <h2>Chat-Verlauf</h2>
        <ul>
          {chatHistory.map((message, index) => (
            <li key={index}>
              <strong>{message.sender}:</strong> {message.text}
            </li>
          ))}
        </ul>
        <CloseButton onClick={onClose}>Schließen</CloseButton>
      </ModalContent>
    </ModalOverlay>
  );
}

export default ChatModal;
