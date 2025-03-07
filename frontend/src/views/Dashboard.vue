<template>
    <div class="dashboard-container">
        <h1>Dashboard</h1>

        <!-- Anzeigen der Benutzerdaten, wenn der Benutzer eingeloggt ist -->
        <div v-if="user">
            <h2>Willkommen, {{ user.username }}</h2>
            <p><strong>Discord ID:</strong> {{ user.id }}</p>

            <h3>Deine Tickets</h3>
            <ul v-if="tickets.length > 0">
                <li v-for="ticket in tickets" :key="ticket.name">
                    <a :href="ticket.url" target="_blank">{{ ticket.name }}</a>
                </li>
            </ul>
            <p v-else>Du hast noch keine Tickets.</p>
        </div>

        <!-- Anzeige der Anmeldeaufforderung, wenn der Benutzer nicht eingeloggt ist -->
        <div v-else>
            <p>Du bist nicht eingeloggt. Bitte melde dich an.</p>
            <!-- Der Benutzer wird sofort weitergeleitet -->
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
        this.checkUserStatus();  // Überprüft, ob der Benutzer eingeloggt ist
    },
    methods: {
        async checkUserStatus() {
            const storedUser = localStorage.getItem("user");
            if (storedUser) {
                this.user = JSON.parse(storedUser); // Setzen des Benutzers aus dem localStorage
                this.fetchTickets();
            } else {
                this.user = null;
                this.storeUserData();  // Wenn der Benutzer nicht im localStorage ist, versuche, Benutzerdaten zu holen
            }
        },

        async storeUserData() {
            try {
                const response = await fetch("http://backendtickets.wonder-craft.de/auth/user", {
                    credentials: "include", // Mit Cookies/Anmeldeinformationen senden
                });

                if (response.ok) {
                    const user = await response.json();
                    this.user = user; // Setzen der Benutzerdaten im Komponentenstatus
                    localStorage.setItem("user", JSON.stringify(user));  // Speichern der Benutzerdaten im localStorage
                } else {
                    console.log("Fehler beim Abrufen der Benutzerdaten");
                }
            } catch (error) {
                console.error("Fehler beim Abrufen der Benutzerdaten:", error);
            }
        },

        async fetchTickets() {
            try {
                const response = await fetch("http://backendtickets.wonder-craft.de/tickets", {
                    credentials: "include",
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

        redirectToHome() {
            this.$router.push("/");  // Weiterleitung zur Startseite (Home.vue)
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
