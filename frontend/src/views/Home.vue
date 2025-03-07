<!-- Home.vue -->
<template>
    <div class="home-container">
        <div class="content">
            <h1>Willkommen bei Wonder-Craft Tickets</h1>
            <p class="description">Verwalte deine Tickets und erhalte Unterstützung über Discord.</p>
            <button @click="loginWithDiscord" class="login-button">Mit Discord anmelden</button>
        </div>
    </div>
</template>

<script>
export default {
    methods: {
        loginWithDiscord() {
            // Weiterleitung zur Authentifizierung
            window.location.href = "http://backendtickets.wonder-craft.de/auth/discord";
        },
    },
};
</script>

<style scoped>
/* Gesamte Seite */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: 'Arial', sans-serif;
}

body {
    background-color: #1a1d23;
    /* Dunklerer Hintergrund für die gesamte Webseite */
    color: #e4e7eb;
    /* Helles Grau für Text */
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    /* Höhe des gesamten Viewports */
    width: 100vw;
    /* Breite des gesamten Viewports */
    overflow: hidden;
}

/* Container für das mittige Element */
.home-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    width: 100%;
    text-align: center;
}

/* Inhalt */
.content {
    background-color: #353b48;
    /* Hellerer Hintergrund für den Container */
    color: #f1f1f1;
    /* Sehr heller Text */
    border-radius: 15px;
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
    /* Sanfte Schatten */
    padding: 40px;
    width: 90%;
    max-width: 450px;
}

h1 {
    font-size: 2.5rem;
    margin-bottom: 20px;
    font-weight: bold;
    color: #fff;
}

.description {
    font-size: 1.2rem;
    margin-bottom: 25px;
    color: #b1bbc5;
    /* Ein weicheres Grau für die Beschreibung */
}

button {
    padding: 12px 30px;
    background-color: #7289da;
    /* Discord Blau */
    color: white;
    border: none;
    cursor: pointer;
    border-radius: 30px;
    /* Abgerundete Ecken */
    font-size: 1.2rem;
    transition: background-color 0.3s ease, transform 0.2s ease;
    width: 100%;
    max-width: 250px;
    margin-top: 20px;
}

button:hover {
    background-color: #5a6eb3;
    /* Dunkleres Blau bei Hover */
    transform: translateY(-3px);
    /* Etwas anheben */
}

button:active {
    transform: translateY(2px);
    /* Knopf gedrückt Animation */
}
</style>
