import React, { useEffect, useState } from "react";
import axios from "axios";
import styled from "styled-components";

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: #36393f;
  padding: 20px;
  border-radius: 8px;
  width: 90%;
  max-width: 800px;
  height: 80vh;
  color: #dcddde;
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 10px 0 rgba(0, 0, 0, 0.2);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 20px;
  border-bottom: 1px solid #202225;
  margin-bottom: 20px;

  h2 {
    color: #fff;
    font-size: 1.3rem;
    font-weight: 600;
    margin: 0;
  }
`;

const ChatContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding-right: 10px;
  margin-bottom: 20px;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: #2f3136;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: #202225;
    border-radius: 4px;

    &:hover {
      background: #18191c;
    }
  }
`;

const MessageGroup = styled.div`
  margin-bottom: 1rem;
  padding: 0.5rem;
  border-radius: 4px;

  &:hover {
    background: #32353b;
  }
`;

const MessageHeader = styled.div`
  display: flex;
  align-items: baseline;
  margin-bottom: 4px;
`;

const MessageSender = styled.span`
  color: #fff;
  font-weight: 500;
  margin-right: 8px;
`;

const MessageTimestamp = styled.span`
  color: #72767d;
  font-size: 0.75rem;
`;

const MessageContent = styled.div`
  color: #dcddde;
  font-size: 1rem;
  line-height: 1.375rem;
  white-space: pre-wrap;
  word-wrap: break-word;
`;

const Embed = styled.div`
  margin-top: 8px;
  padding: 8px 16px;
  border-left: 4px solid ${(props) => props.color || "#4f545c"};
  background: #2f3136;
  border-radius: 4px;

  img {
    max-width: 100%;
    max-height: 300px;
    border-radius: 4px;
    margin-top: 8px;
  }
`;

const CloseButton = styled.button`
  background: transparent;
  color: #dcddde;
  border: none;
  padding: 8px;
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;

  &:hover {
    background: #2f3136;
    color: #fff;
  }

  svg {
    width: 24px;
    height: 24px;
  }
`;

function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Hilfsfunktion zum Parsen von Discord-Embeds
function parseEmbed(content) {
  try {
    if (typeof content === "string" && content.startsWith("{")) {
      return JSON.parse(content);
    }
  } catch (e) {}
  return null;
}

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
    return (
      <ModalOverlay>
        <ModalContent>
          <div>Lade Chat-Verlauf...</div>
        </ModalContent>
      </ModalOverlay>
    );
  }

  if (error) {
    return (
      <ModalOverlay>
        <ModalContent>
          <div>{error}</div>
        </ModalContent>
      </ModalOverlay>
    );
  }

  return (
    <ModalOverlay>
      <ModalContent>
        <ModalHeader>
          <h2>Chat-Verlauf #{ticketId}</h2>
          <CloseButton onClick={onClose}>
            <svg viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M18.4 4L12 10.4L5.6 4L4 5.6L10.4 12L4 18.4L5.6 20L12 13.6L18.4 20L20 18.4L13.6 12L20 5.6L18.4 4Z"
              />
            </svg>
          </CloseButton>
        </ModalHeader>
        <ChatContainer>
          {chatHistory.map((message, index) => {
            const embed = parseEmbed(message.text);

            return (
              <MessageGroup key={index}>
                <MessageHeader>
                  <MessageSender>{message.sender}</MessageSender>
                  <MessageTimestamp>
                    {formatTimestamp(message.timestamp)}
                  </MessageTimestamp>
                </MessageHeader>
                <MessageContent>
                  {!embed && message.text}
                  {embed && (
                    <Embed color={embed.color}>
                      {embed.title && <h4>{embed.title}</h4>}
                      {embed.description && <p>{embed.description}</p>}
                      {embed.image && <img src={embed.image.url} alt="Embed" />}
                      {embed.fields &&
                        embed.fields.map((field, i) => (
                          <div key={i}>
                            <strong>{field.name}</strong>
                            <p>{field.value}</p>
                          </div>
                        ))}
                    </Embed>
                  )}
                </MessageContent>
              </MessageGroup>
            );
          })}
        </ChatContainer>
      </ModalContent>
    </ModalOverlay>
  );
}

export default ChatModal;
