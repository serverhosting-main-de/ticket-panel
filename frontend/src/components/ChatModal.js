import React, { useEffect, useState } from "react";
import axios from "axios";
import styled from "styled-components";

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  overflow: hidden;
`;

const ModalContent = styled.div`
  background: #2b2d31;
  padding: 20px;
  border-radius: 12px;
  width: 90%;
  max-width: 800px;
  height: 80vh;
  color: #e3e5e8;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  position: relative;
  overflow: hidden;
  border: 1px solid #1e2022;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 20px;
  border-bottom: 1px solid #1e2022;
  margin-bottom: 20px;

  h2 {
    color: #fff;
    font-size: 1.4rem;
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
    background: #1e2022;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: #2b2d31;
    border-radius: 4px;

    &:hover {
      background: #36393f;
    }
  }
`;

const MessageGroup = styled.div`
  margin-bottom: 1rem;
  padding: 0.8rem;
  border-radius: 8px;
  display: flex;
  gap: 16px;
  transition: background-color 0.2s ease;

  &:hover {
    background: #36393f;
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
  border: 2px solid #5865f2;
`;

const MessageHeader = styled.div`
  display: flex;
  align-items: baseline;
  margin-bottom: 4px;
`;

const MessageSender = styled.span`
  color: #fff;
  font-weight: 600;
  margin-right: 8px;
`;

const MessageTimestamp = styled.span`
  color: #a3a6aa;
  font-size: 0.75rem;
`;

const MessageContent = styled.div`
  flex-grow: 1;
  color: #e3e5e8;
  font-size: 1rem;
  line-height: 1.5;
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
  padding: 12px 16px;
  border-left: 4px solid ${(props) => props.color || "#5865f2"};
  background: #36393f;
  border-radius: 8px;
  max-width: 520px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  .embed-title {
    color: #fff;
    font-size: 1rem;
    font-weight: 600;
    margin-bottom: 8px;
  }

  .embed-description {
    color: #e3e5e8;
    font-size: 0.9375rem;
    line-height: 1.4;
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
      color: #e3e5e8;
      font-size: 0.875rem;
      line-height: 1.4;
      white-space: pre-wrap;
    }
  }

  .embed-footer {
    color: #a3a6aa;
    font-size: 0.75rem;
    margin-top: 8px;
  }
`;

const EmbedImage = styled.img`
  max-width: 100%;
  max-height: 300px;
  border-radius: 8px;
  margin-top: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: pointer;

  &:hover {
    transform: scale(1.02);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
`;

const EmbedThumbnail = styled.img`
  max-width: 80px;
  max-height: 80px;
  border-radius: 8px;
  float: right;
  margin-left: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const CloseButton = styled.button`
  background: transparent;
  color: #a3a6aa;
  border: none;
  padding: 8px;
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    background: #36393f;
    color: #fff;
  }

  svg {
    width: 24px;
    height: 24px;
  }
`;

const ReactionContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 8px;
`;

const Reaction = styled.div`
  background: #36393f;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 0.875rem;
  color: #e3e5e8;
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background: #40444b;
  }
`;

const AttachmentContainer = styled.div`
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Attachment = styled.div`
  background: #36393f;
  border-radius: 8px;
  padding: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  max-width: 520px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const AttachmentIcon = styled.div`
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #2b2d31;
  border-radius: 4px;
`;

const AttachmentInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const AttachmentName = styled.div`
  color: #00b0f4;
  font-size: 0.875rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  a {
    color: #00b0f4;
    text-decoration: none;
    transition: color 0.2s ease;

    &:hover {
      color: #0095ff;
      text-decoration: underline;
    }
  }
`;

const AttachmentSize = styled.div`
  color: #a3a6aa;
  font-size: 0.75rem;
`;

const AttachmentImage = styled.img`
  max-width: 100%;
  max-height: 300px;
  border-radius: 8px;
  margin-top: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: pointer;

  &:hover {
    transform: scale(1.02);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
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

  // Ersetze `Text` mit <code>Text</code>
  text = text.replace(/`(.*?)`/g, (match, p1) => `<code>${p1}</code>`);

  // Ersetze bereits vorhandene HTML-Tags, damit sie nicht doppelt formatiert werden
  text = text.replace(/&lt;strong&gt;/g, "<strong>");
  text = text.replace(/&lt;\/strong&gt;/g, "</strong>");
  text = text.replace(/&lt;code&gt;/g, "<code>");
  text = text.replace(/&lt;\/code&gt;/g, "</code>");

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
      : "#5865f2";

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
          <div
            className="embed-description"
            dangerouslySetInnerHTML={{
              __html: formatMessage(embed.description),
            }}
          />
        )}

        {embed.fields && embed.fields.length > 0 && (
          <div className="embed-fields">
            {embed.fields.map((field, fieldIndex) => (
              <div key={fieldIndex} className="embed-field">
                <div
                  className="field-name"
                  dangerouslySetInnerHTML={{
                    __html: formatMessage(field.name),
                  }}
                />
                <div
                  className="field-value"
                  dangerouslySetInnerHTML={{
                    __html: formatMessage(field.value),
                  }}
                />
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
                      "https://cdn.discordapp.com/embed/avatars/0.png";
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
                    />
                  )}
                  {message.attachments && message.attachments.length > 0 && (
                    <AttachmentContainer>
                      {message.attachments.map((attachment, index) => (
                        <div key={index}>
                          {attachment.contentType.startsWith("image/") ? (
                            <a
                              href={attachment.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <AttachmentImage
                                src={attachment.url}
                                alt={attachment.name}
                              />
                            </a>
                          ) : (
                            <Attachment>
                              <AttachmentIcon>📎</AttachmentIcon>
                              <AttachmentInfo>
                                <AttachmentName>
                                  <a
                                    href={attachment.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    {attachment.name}
                                  </a>
                                </AttachmentName>
                                <AttachmentSize>
                                  {(attachment.size / 1024).toFixed(2)} KB
                                </AttachmentSize>
                              </AttachmentInfo>
                            </Attachment>
                          )}
                        </div>
                      ))}
                    </AttachmentContainer>
                  )}
                  {message.embeds && message.embeds.length > 0 && (
                    <EmbedContainer>
                      {message.embeds.map((embed, embedIndex) =>
                        renderEmbed(embed, embedIndex)
                      )}
                    </EmbedContainer>
                  )}
                  {message.reactions && message.reactions.length > 0 && (
                    <ReactionContainer>
                      {message.reactions.map((reaction, index) => (
                        <Reaction key={index}>
                          {reaction.emoji} {reaction.count}
                        </Reaction>
                      ))}
                    </ReactionContainer>
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
