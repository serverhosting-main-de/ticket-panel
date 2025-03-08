import React from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";

const HomeContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f0f0f0;
`;

const WelcomeBox = styled.div`
  background-color: white;
  padding: 40px;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
`;

const Title = styled.h1`
  font-size: 36px;
  margin-bottom: 20px;
  color: #333;
  font-weight: 600;
  line-height: 1.2;
`;

const Description = styled.p`
  font-size: 20px;
  color: #555;
  line-height: 1.6;
  margin-bottom: 30px;
`;

const CallToAction = styled.p`
  font-size: 18px;
  color: #777;
  font-style: italic;
  margin-bottom: 20px;
`;

const ActionButton = styled.button`
  padding: 15px 30px;
  font-size: 18px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #0056b3;
  }
`;

function Home() {
  const navigate = useNavigate();
  const isLoggedIn = localStorage.getItem("loggedIn") === "true";

  const handleButtonClick = () => {
    if (isLoggedIn) {
      navigate("/dashboard");
    } else {
      navigate("/login");
    }
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
        <ActionButton onClick={handleButtonClick}>
          {isLoggedIn ? "Zum Dashboard" : "Zum Login"}
        </ActionButton>
      </WelcomeBox>
    </HomeContainer>
  );
}

export default Home;
