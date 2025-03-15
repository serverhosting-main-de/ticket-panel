import React from "react";
import styled from "styled-components";
import { useNavigate, useEffect } from "react-router-dom";
import axios from "axios";

// Styled Components
const LoginContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: linear-gradient(135deg, #37474f, #455a64);
  color: #e0e0e0;
`;

const LoginBox = styled.div`
  background-color: rgba(0, 0, 0, 0.4);
  padding: 60px;
  border-radius: 12px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
  text-align: center;
  max-width: 400px;
`;

const LoginTitle = styled.h1`
  font-size: 28px;
  margin-bottom: 30px;
  font-weight: 600;
  letter-spacing: -0.5px;
`;

const LoginButton = styled.button`
  background: linear-gradient(135deg, #7289da, #677bc4);
  color: white;
  padding: 15px 30px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 18px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.4);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  }
`;

function Login() {
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      // Öffne das Discord-OAuth2-Fenster
      const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${
        process.env.REACT_APP_DISCORD_CLIENT_ID
      }&redirect_uri=${encodeURIComponent(
        process.env.REACT_APP_DISCORD_REDIRECT_URI
      )}&response_type=code&scope=identify+guilds`;
      window.location.href = discordAuthUrl;
    } catch (error) {
      console.error("Fehler beim Weiterleiten zur Discord-Anmeldung:", error);
    }
  };

  // Überprüfe, ob ein Token in der URL vorhanden ist (nach der Weiterleitung vom Backend)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");

    if (token) {
      // Speichere das JWT im Local Storage
      localStorage.setItem("token", token);

      // Hole Benutzerdaten vom Backend
      const fetchUserData = async () => {
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
            // Speichere Benutzerdaten im Local Storage
            localStorage.setItem("userData", JSON.stringify(response.data));

            // Weiterleitung zum Dashboard
            navigate("/dashboard");
          } else {
            console.error("Benutzer ist nicht authentifiziert.");
          }
        } catch (error) {
          console.error("Fehler beim Abrufen der Benutzerdaten:", error);
        }
      };

      fetchUserData();
    }
  }, [navigate]);

  return (
    <LoginContainer>
      <LoginBox>
        <LoginTitle>Mit Discord anmelden</LoginTitle>
        <LoginButton onClick={handleLogin}>Mit Discord anmelden</LoginButton>
      </LoginBox>
    </LoginContainer>
  );
}

export default Login;
