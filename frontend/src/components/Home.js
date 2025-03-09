import React, { useEffect } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";

const HomeContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: linear-gradient(135deg, #1a2a6c, #2b324c);
  color: #e0e0e0;
`;

const WelcomeBox = styled.div`
  background-color: rgba(0, 0, 0, 0.5);
  padding: 60px;
  border-radius: 12px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
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
  color: #bdbdbd;
  line-height: 1.7;
  margin-bottom: 40px;
`;

const CallToAction = styled.p`
  font-size: 18px;
  color: #90a4ae;
  font-style: italic;
  margin-bottom: 30px;
`;

function Home() {
  const navigate = useNavigate();
  const isLoggedIn = localStorage.getItem("loggedIn") === "true";

  useEffect(() => {
    if (isLoggedIn) {
      navigate("/dashboard");
    } else {
      navigate("/login");
    }
  }, [isLoggedIn, navigate]);

  return (
    <HomeContainer>
      <WelcomeBox>
        <Title>Ihr persönliches Ticket-Archiv</Title>
        <Description>
          Entdecken Sie vergangene Support-Anfragen und behalten Sie den
          Überblick über Ihre Ticket-Historie.
        </Description>
        <CallToAction>Einblick in Ihre vergangenen Anliegen.</CallToAction>
      </WelcomeBox>
    </HomeContainer>
  );
}

export default Home;
