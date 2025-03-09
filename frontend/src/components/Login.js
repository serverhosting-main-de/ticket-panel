import React from "react";
import styled from "styled-components";

const LoginContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f0f0f0;
`;

const LoginBox = styled.div`
  background-color: #262626;
  padding: 40px;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
`;

const LoginTitle = styled.h1`
  font-size: 24px;
  margin-bottom: 20px;
`;

const LoginButton = styled.button`
  background-color: #7289da;
  color: white;
  padding: 12px 24px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;

  &:hover {
    background-color: #677bc4;
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
