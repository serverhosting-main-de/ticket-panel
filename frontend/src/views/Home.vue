<template>
    <div class="home-container">
        <div class="content">
            <h1>Willkommen bei Wonder-Craft Tickets</h1>
            <p class="description">Verwalte deine Tickets und erhalte Unterstützung über Discord.</p>

            <!-- Zeige Login-Button nur, wenn der Benutzer nicht eingeloggt ist -->
            <button v-if="!user" @click="loginWithDiscord" class="login-button">Mit Discord anmelden</button>
            <div v-else>
                <p>Du bist bereits eingeloggt. Weiterleitung zum Dashboard...</p>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    data() {
        return {
            user: null,
        };
    },
    created() {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            this.user = JSON.parse(storedUser);
            this.$router.push("/dashboard");  // Weiterleitung zum Dashboard, wenn der Benutzer eingeloggt ist
        }
    },
    methods: {
        loginWithDiscord() {
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
    color: #e4e7eb;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    width: 100vw;
    overflow: hidden;
}

.home-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    width: 100%;
    text-align: center;
}

.content {
    background-color: #353b48;
    color: #f1f1f1;
    border-radius: 15px;
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
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
}

button {
    padding: 12px 30px;
    background-color: #7289da;
    color: white;
    border: none;
    cursor: pointer;
    border-radius: 30px;
    font-size: 1.2rem;
    transition: background-color 0.3s ease, transform 0.2s ease;
    width: 100%;
    max-width: 250px;
    margin-top: 20px;
}

button:hover {
    background-color: #5a6eb3;
    transform: translateY(-3px);
}

button:active {
    transform: translateY(2px);
}
</style>
