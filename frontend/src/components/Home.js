import React from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";

const HomeContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: linear-gradient(
    135deg,
    #1a2a6c,
    #2b324c
  ); /* Dunklerer Farbverlauf */
  color: #e0e0e0;
`;

const WelcomeBox = styled.div`
  background-color: rgba(0, 0, 0, 0.5); /* Dunkler, transparenter Hintergrund */
  padding: 60px;
  border-radius: 12px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3); /* Stärkere Schatten für mehr Tiefe */
  text-align: center;
  max-width: 600px;
`;

const Title = styled.h1`
  font-size: 42px;
  margin-bottom: 25px;
  font-weight: 700;
  line-height: 1.3;
  letter-spacing: -1px;
`;

const Description = styled.p`
  font-size: 20px;
  color: #bdbdbd; /* Etwas helleres Grau für Lesbarkeit */
  line-height: 1.7;
  margin-bottom: 40px;
`;

const CallToAction = styled.p`
  font-size: 18px;
  color: #90a4ae; /* Ein dezenter Blauton für den Akzent */
  font-style: italic;
  margin-bottom: 30px;
`;

const ActionButton = styled.button`
  padding: 18px 40px;
  font-size: 20px;
  background: linear-gradient(
    135deg,
    #1a2a6c,
    #2b324c
  ); /* Dunklerer Button-Farbverlauf */
  color: white;
  border: 1px solid #37474f; /* Rand für bessere Definition */
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.4);
  }
`;

function Home() {
  const navigate = useNavigate();
  const isLoggedIn = localStorage.getItem("loggedIn") === "true";

  const redirectToDashboard = () => {
    navigate("/dashboard");
  };

  const redirectToLogin = () => {
    navigate("/login");
  };

  return (
    <HomeContainer>
      <WelcomeBox>
        <Title>Ihr persönliches Ticket-Archiv</Title>
        <Description>
          Entdecken Sie vergangene Support-Anfragen und behalten Sie den
          Überblick über Ihre Ticket-Historie.
        </Description>
        <CallToAction>Einblick in Ihre vergangenen Anliegen.</CallToAction>
        <ActionButton
          onClick={isLoggedIn ? redirectToDashboard : redirectToLogin}
        >
          {isLoggedIn ? "Zum Dashboard" : "Zum Login"}
        </ActionButton>
      </WelcomeBox>
    </HomeContainer>
  );
}

export default Home;
