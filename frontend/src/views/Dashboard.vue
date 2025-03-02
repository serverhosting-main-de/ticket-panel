<!-- Dashboard.vue -->
<template>
    <div>
        <h1>Dashboard</h1>
        <div v-if="user">
            <h2>Willkommen, {{ user.username }}</h2>
            <p><strong>Discord ID:</strong> {{ user.id }}</p>
            <h3>Deine Tickets</h3>
            <ul>
                <li v-for="ticket in tickets" :key="ticket.name">
                    <a :href="ticket.url" target="_blank">{{ ticket.name }}</a>
                </li>
            </ul>
        </div>
        <div v-else>
            <p>Du bist nicht eingeloggt. Bitte melde dich an.</p>
            <button @click="loginWithDiscord">Mit Discord anmelden</button>
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
            // Benutzerinformationen vom Backend abrufen
            const response = await fetch("http://tickets.wonder-craft.de:3000/auth/user", {
                credentials: "include", // Cookies mitschicken für Session
            });

            if (response.ok) {
                this.user = await response.json();
                localStorage.setItem("user", JSON.stringify(this.user)); // Benutzerdaten im LocalStorage speichern
            } else {
                this.user = null;
            }
        },
        async fetchTickets() {
            // Tickets für den eingeloggten Benutzer abrufen
            const response = await fetch("http://tickets.wonder-craft.de:3000/tickets", {
                credentials: "include", // Cookies mitschicken für Session
            });

            if (response.ok) {
                this.tickets = await response.json();
            } else {
                this.tickets = [];
            }
        },
        loginWithDiscord() {
            // Weiterleitung zur Discord-Login-Seite
            window.location.href = "http://tickets.wonder-craft.de:3000/auth/discord";
        },
    },
};
</script>

<style scoped>
button {
    padding: 10px 20px;
    background-color: #7289da;
    color: white;
    border: none;
    cursor: pointer;
    border-radius: 5px;
}
</style>
