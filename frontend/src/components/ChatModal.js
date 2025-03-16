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
  overflow: hidden;
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
  position: relative;
  overflow: hidden;
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
  position: absolute;
  top: 80px;
  bottom: 20px;
  left: 20px;
  right: 20px;
  overflow-x: hidden;

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
  display: flex;
  gap: 16px;

  &:hover {
    background: #32353b;
  }
`;

const AvatarContainer = styled.div`
  flex-shrink: 0;
`;

const Avatar = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
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
  flex-grow: 1;
  color: #dcddde;
  font-size: 1rem;
  line-height: 1.375rem;
  white-space: pre-wrap;
  word-wrap: break-word;
  min-width: 0;
`;

const EmbedContainer = styled.div`
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Embed = styled.div`
  padding: 8px 16px;
  border-left: 4px solid ${(props) => props.color || "#4f545c"};
  background: #2f3136;
  border-radius: 4px;
  max-width: 520px;

  .embed-title {
    color: #fff;
    font-size: 1rem;
    font-weight: 600;
    margin-bottom: 8px;
  }

  .embed-description {
    color: #dcddde;
    font-size: 0.9375rem;
    line-height: 1.3;
    margin-bottom: 8px;
    white-space: pre-wrap;
  }

  .embed-fields {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 8px;
    margin: 8px 0;
  }

  .embed-field {
    margin-bottom: 8px;

    .field-name {
      color: #fff;
      font-size: 0.875rem;
      font-weight: 600;
      margin-bottom: 2px;
    }

    .field-value {
      color: #dcddde;
      font-size: 0.875rem;
      line-height: 1.125rem;
      white-space: pre-wrap;
    }
  }

  .embed-footer {
    color: #72767d;
    font-size: 0.75rem;
    margin-top: 8px;
  }
`;

const EmbedImage = styled.img`
  max-width: 100%;
  max-height: 300px;
  border-radius: 4px;
  margin-top: 8px;
`;

const EmbedThumbnail = styled.img`
  max-width: 80px;
  max-height: 80px;
  border-radius: 4px;
  float: right;
  margin-left: 16px;
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

const formatMessage = (text) => {
  if (!text) return "";

  // Ersetze Rollen-Mentions
  text = text.replace(/<@&(\d+)>/g, (match, roleId) => {
    const roles = {
      "1218665756217049088": "Support",
      "1218660814186348744": "🛠️ Administrator",
      // Füge hier weitere Rollen hinzu
    };
    return `@${roles[roleId] || "Rolle"}`;
  });

  // Ersetze User-Mentions
  text = text.replace(/<@!?(\d+)>/g, (match, userId) => {
    const users = {
      341146999560601600: "Dominic",
      // Füge hier weitere User hinzu
    };
    return `@${users[userId] || "User"}`;
  });

  // Ersetze Channel-Mentions
  text = text.replace(/<#(\d+)>/g, "#channel");

  // Ersetze **Text** mit <strong>Text</strong>
  text = text.replace(
    /\*\*(.*?)\*\*/g,
    (match, p1) => `<strong>${p1}</strong>`
  );

  return text;
};

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

  useEffect(() => {
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const renderEmbed = (embed, index) => {
    const embedColor = embed.color
      ? `#${embed.color.toString(16).padStart(6, "0")}`
      : "#4f545c";

    return (
      <Embed key={index} color={embedColor}>
        {embed.author && (
          <div className="embed-author">{embed.author.name}</div>
        )}

        {embed.title && <div className="embed-title">{embed.title}</div>}

        {embed.thumbnail && (
          <EmbedThumbnail src={embed.thumbnail.url} alt="Thumbnail" />
        )}

        {embed.description && (
          <div className="embed-description">
            {formatMessage(embed.description)}
          </div>
        )}

        {embed.fields && embed.fields.length > 0 && (
          <div className="embed-fields">
            {embed.fields.map((field, fieldIndex) => (
              <div key={fieldIndex} className="embed-field">
                <div className="field-name">{field.name}</div>
                <div className="field-value">{formatMessage(field.value)}</div>
              </div>
            ))}
          </div>
        )}

        {embed.image && <EmbedImage src={embed.image.url} alt="Embed Image" />}

        {embed.footer && (
          <div className="embed-footer">{embed.footer.text}</div>
        )}
      </Embed>
    );
  };

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
          {chatHistory.map((message, index) => (
            <MessageGroup key={index}>
              <AvatarContainer>
                <Avatar
                  src={message.avatarURL}
                  alt={message.sender}
                  onError={(e) => {
                    e.target.src =
                      "https://cdn.discordapp.com/embed/avatars/0.png"; // Discord Default Avatar
                  }}
                />
              </AvatarContainer>
              <div>
                <MessageHeader>
                  <MessageSender>{message.sender}</MessageSender>
                  <MessageTimestamp>
                    {formatTimestamp(message.timestamp)}
                  </MessageTimestamp>
                </MessageHeader>
                <MessageContent>
                  {message.text && (
                    <div
                      dangerouslySetInnerHTML={{
                        __html: formatMessage(message.text),
                      }}
                    ></div>
                  )}
                  {message.embeds && message.embeds.length > 0 && (
                    <EmbedContainer>
                      {message.embeds.map((embed, embedIndex) =>
                        renderEmbed(embed, embedIndex)
                      )}
                    </EmbedContainer>
                  )}
                </MessageContent>
              </div>
            </MessageGroup>
          ))}
        </ChatContainer>
      </ModalContent>
    </ModalOverlay>
  );
}

export default ChatModal;
