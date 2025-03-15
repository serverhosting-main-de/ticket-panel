import React from "react";
import styled from "styled-components";

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
`;

function Login() {
  const handleLogin = () => {
    window.location.href = "https://backendtickets.wonder-craft.de/login";
  };

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
