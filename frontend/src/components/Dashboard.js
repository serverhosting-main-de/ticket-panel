import React from "react";
import { useLocation } from "react-router-dom";

function Dashboard() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const username = searchParams.get("username");

  return (
    <div>
      <h1>Willkommen im Dashboard, {username}!</h1>
      <p>Hier kannst du deine Tickets einsehen.</p>
    </div>
  );
}

export default Dashboard;
