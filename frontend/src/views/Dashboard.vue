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
        this.checkUserStatus();
    },
    methods: {
        async checkUserStatus() {
            const storedUser = localStorage.getItem("user");
            if (storedUser) {
                this.user = JSON.parse(storedUser);
                this.fetchTickets();
            } else {
                this.user = null;
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
    },
};
</script>
