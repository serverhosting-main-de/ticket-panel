import React from "react";
import styled from "styled-components";

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
`;

function Home() {
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
