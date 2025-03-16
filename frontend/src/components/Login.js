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
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #ffffff;
  font-family: "Poppins", sans-serif;
`;

const LoginBox = styled.div`
  background-color: rgba(255, 255, 255, 0.1);
  padding: 60px;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
  text-align: center;
  max-width: 400px;
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const LoginTitle = styled.h1`
  font-size: 32px;
  margin-bottom: 30px;
  font-weight: 600;
  letter-spacing: -0.5px;
  color: #ffffff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
`;

const LoginButton = styled.button`
  background: linear-gradient(135deg, #7289da, #5b6eae);
  color: white;
  padding: 15px 30px;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-size: 18px;
  font-weight: 500;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
    background: linear-gradient(135deg, #677bc4, #4a5a9e);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
`;

const LoadingText = styled.p`
  font-size: 16px;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 20px;
`;

const ErrorText = styled.p`
  font-size: 16px;
  color: #ff6b6b;
  margin-bottom: 20px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
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
