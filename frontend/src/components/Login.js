import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// Styled Components
const LoginContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: #36393f;
  color: #ffffff;
  font-family: "Segoe UI", "Helvetica Neue", sans-serif;
`;

const LoginBox = styled.div`
  background-color: #2f3136;
  padding: 40px;
  border-radius: 8px;
  box-shadow: 0 2px 10px 0 rgba(0, 0, 0, 0.2);
  text-align: center;
  max-width: 400px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const LoginTitle = styled.h1`
  font-size: 24px;
  margin-bottom: 30px;
  font-weight: 600;
  color: #ffffff;
`;

const LoginButton = styled.button`
  background-color: #5865f2;
  color: white;
  padding: 12px 24px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  transition: background-color 0.2s ease;
  width: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  &:hover {
    background-color: #4752c4;
  }

  &:active {
    background-color: #3c45a5;
  }
`;

const LoadingText = styled.p`
  font-size: 16px;
  color: #b9bbbe;
  margin-top: 20px;
`;

const ErrorText = styled.p`
  font-size: 14px;
  color: #ed4245;
  margin-bottom: 20px;
`;

function Login() {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    console.log("Login with Discord");
    console.log("ENV", process.env.REACT_APP_DISCORD_CLIENT_ID);
    console.log("ENV", process.env.REACT_APP_DISCORD_REDIRECT_URI);
    try {
      const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${
        process.env.REACT_APP_DISCORD_CLIENT_ID
      }&redirect_uri=${encodeURIComponent(
        process.env.REACT_APP_DISCORD_REDIRECT_URI
      )}&response_type=code&scope=identify+guilds`;
      window.location.href = discordAuthUrl;
    } catch (error) {
      console.error("Fehler beim Weiterleiten zur Discord-Anmeldung:", error);
      setError("Fehler bei der Anmeldung. Bitte versuche es später erneut.");
    }
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");

    if (token) {
      localStorage.setItem("token", token);

      const fetchUserData = async () => {
        setLoading(true);
        try {
          const response = await axios.get(
            "https://backendtickets.wonder-craft.de/api/auth/status",
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (response.data.isLoggedIn) {
            localStorage.setItem("userData", JSON.stringify(response.data));
            navigate("/dashboard");
          } else {
            setError("Benutzer ist nicht authentifiziert.");
          }
        } catch (error) {
          console.error("Fehler beim Abrufen der Benutzerdaten:", error);
          setError(
            "Fehler bei der Authentifizierung. Bitte melde dich erneut an."
          );
        } finally {
          setLoading(false);
        }
      };

      fetchUserData();
    }
  }, [navigate]);

  return (
    <LoginContainer>
      <LoginBox>
        <LoginTitle>Mit Discord anmelden</LoginTitle>
        {error && <ErrorText>{error}</ErrorText>}
        {loading ? (
          <LoadingText>Lade Benutzerdaten...</LoadingText>
        ) : (
          <LoginButton onClick={handleLogin}>
            <span>Mit Discord anmelden</span>
          </LoginButton>
        )}
      </LoginBox>
    </LoginContainer>
  );
}

export default Login;
