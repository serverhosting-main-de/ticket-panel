<!-- Dashboard.vue -->
<template>
    <div class="dashboard-container">
        <h1>Dashboard</h1>

        <!-- Anzeigen der Benutzerdaten, wenn der Benutzer eingeloggt ist -->
        <div v-if="user">
            <h2>Willkommen, {{ user.username }}</h2>
            <p><strong>Discord ID:</strong> {{ user.id }}</p>

            <h3>Deine Tickets</h3>
            <!-- Anzeige der Tickets -->
            <ul v-if="tickets.length > 0">
                <li v-for="ticket in tickets" :key="ticket.name">
                    <a :href="ticket.url" target="_blank">{{ ticket.name }}</a>
                </li>
            </ul>

            <!-- Nachricht, falls keine Tickets vorhanden sind -->
            <p v-else>Du hast noch keine Tickets.</p>
        </div>

        <!-- Anzeige der Anmeldeaufforderung, wenn der Benutzer nicht eingeloggt ist -->
        <div v-else>
            <p>Du bist nicht eingeloggt. Bitte melde dich an.</p>
            <button @click="loginWithDiscord" class="login-button">Mit Discord anmelden</button>
        </div>
    </div>
</template>

<script>
export default {
    data() {
        return {
            user: null,
            tickets: [],
        };
    },
    created() {
        this.fetchUser();
        this.fetchTickets();
    },
    methods: {
        async fetchUser() {
            try {
                const response = await fetch("http://backendtickets.wonder-craft.de/auth/user", {
                    credentials: "include", // Cookies mitschicken für Session
                });

                if (response.ok) {
                    this.user = await response.json();
                    localStorage.setItem("user", JSON.stringify(this.user)); // Benutzerdaten im LocalStorage speichern
                } else {
                    this.user = null;
                }
            } catch (error) {
                console.error("Fehler beim Abrufen der Benutzerinformationen:", error);
                this.user = null;
            }
        },
        async fetchTickets() {
            try {
                const response = await fetch("http://backendtickets.wonder-craft.de/tickets", {
                    credentials: "include", // Cookies mitschicken für Session
                });

                if (response.ok) {
                    this.tickets = await response.json();
                } else {
                    this.tickets = [];
                }
            } catch (error) {
                console.error("Fehler beim Abrufen der Tickets:", error);
                this.tickets = [];
            }
        },
        loginWithDiscord() {
            window.location.href = "http://backendtickets.wonder-craft.de/auth/discord";
        },
    },
};
</script>

<style scoped>
.dashboard-container {
    text-align: center;
    padding: 20px;
    max-width: 800px;
    margin: 0 auto;
}

h1 {
    font-size: 2.5rem;
    color: #7289da;
}

h2 {
    color: #5c6bc0;
}

h3 {
    font-size: 1.5rem;
    margin-top: 20px;
}

ul {
    list-style-type: none;
    padding: 0;
}

li {
    margin: 10px 0;
}

a {
    text-decoration: none;
    color: #4a90e2;
}

a:hover {
    text-decoration: underline;
}

button {
    padding: 10px 20px;
    background-color: #7289da;
    color: white;
    border: none;
    cursor: pointer;
    border-radius: 5px;
    font-size: 1.1rem;
    margin-top: 20px;
}

button:hover {
    background-color: #5a6eb3;
}

p {
    font-size: 1.1rem;
}
</style>