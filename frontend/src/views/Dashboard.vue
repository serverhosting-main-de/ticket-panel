<template>
    <div class="dashboard-container">
        <h1>Dashboard</h1>

        <div v-if="isLoading">
            <p>Lade Dashboard...</p>
        </div>

        <div v-else-if="error">
            <p>{{ error }}</p>
        </div>

        <div v-else-if="user">
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

        <div v-else>
            <p>Du bist nicht eingeloggt. Bitte melde dich an.</p>
        </div>
    </div>
</template>

<script>
export default {
    data() {
        return {
            user: null,
            tickets: [],
            isLoading: true,
            error: null,
        };
    },
    created() {
        console.log("Dashboard wird geladen...");
        this.checkUserStatus();
    },
    methods: {
        async checkUserStatus() {
            console.log("Überprüfe Benutzerstatus...");
            this.isLoading = true;
            this.error = null;
            try {
                const token = document.cookie.replace(/(?:(?:^|.*;\s*)token\s*\=\s*([^;]*).*$)|^.*$/, "$1"); // Cookie abrufen
                if (token) {
                    const response = await fetch("http://backendtickets.wonder-craft.de/auth/user", {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    });
                    if (response.ok) {
                        this.user = await response.json();
                        await this.fetchTickets();
                    } else {
                        console.error("Fehler beim Abrufen der Benutzerdaten:", response.status, response.statusText);
                        this.error = "Fehler beim Laden der Benutzerdaten.";
                    }
                }
            } catch (err) {
                console.error("Fehler beim Überprüfen des Benutzerstatus:", err);
                this.error = "Fehler beim Laden des Dashboards.";
            } finally {
                this.isLoading = false;
            }
        },
        async fetchTickets() {
            console.log("Lade Tickets...");
            try {
                const token = document.cookie.replace(/(?:(?:^|.*;\s*)token\s*\=\s*([^;]*).*$)|^.*$/, "$1"); // Cookie abrufen
                const response = await fetch("http://backendtickets.wonder-craft.de/tickets", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                if (response.ok) {
                    this.tickets = await response.json();
                } else {
                    console.error("Fehler beim Abrufen der Tickets:", response.status, response.statusText);
                    this.error = "Fehler beim Laden der Tickets.";
                }
            } catch (err) {
                console.error("Fehler beim Abrufen der Tickets:", err);
                this.error = "Fehler beim Laden der Tickets.";
            }
        },
        redirectToLogin() {
            window.location.href = "http://tickets.wonder-craft.de/";
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