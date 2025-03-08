import React from "react";

function Login() {
  const handleLogin = () => {
    window.location.href = "https://backendtickets.wonder-craft.de/login"; // Link zum Backend-Login
  };

  return (
    <div>
      <h1>Mit Discord anmelden</h1>
      <button onClick={handleLogin}>Mit Discord anmelden</button>
    </div>
  );
}

export default Login;
